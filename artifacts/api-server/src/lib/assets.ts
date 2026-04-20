import { randomBytes } from "node:crypto";
import { db, assetsTable, venuesTable, handlersTable, eventsTable } from "@workspace/db";
import type { AssetRow, EventRow } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { buildSeedAssets, VENUE_DEFAULTS, VENUE_TYPE_DEFAULTS } from "./seed";
import { signTicket } from "./signing";

const DEMO_VENUE_CODES = new Set(Object.keys(VENUE_DEFAULTS));

export interface SerializedTamperEvent {
  id: string;
  venueCode: string;
  ticketId: string | null;
  assetId: string | null;
  source: "scan" | "manual" | null;
  reason: string;
  at: number;
}

export function serializeTamperEvent(row: EventRow): SerializedTamperEvent {
  const meta = (row.meta ?? {}) as Record<string, unknown>;
  const ticketIdRaw = meta.ticketId;
  const sourceRaw = meta.source;
  const reasonRaw = meta.reason;
  return {
    id: row.id,
    venueCode: row.venueId,
    ticketId: typeof ticketIdRaw === "string" ? ticketIdRaw : null,
    assetId: row.assetId ?? null,
    source:
      sourceRaw === "scan" || sourceRaw === "manual" ? sourceRaw : null,
    reason:
      typeof reasonRaw === "string" && reasonRaw.length > 0
        ? reasonRaw
        : "Invalid tag signature",
    at: row.at.getTime(),
  };
}

export interface SerializedAsset {
  id: string;
  ticketId: string;
  venueCode: string;
  mode: "vehicles" | "baggage" | "cloakrooms" | "bags";
  patron: { name: string; phone: string };
  fields: Record<string, string | number | boolean>;
  photos: string[];
  intakeAt: number;
  handler: string;
  status: "active" | "released";
  releasedAt: number | null;
  releasedBy: string | null;
  signature: string;
}

export function serializeAsset(
  row: AssetRow,
  venueSecret: string,
  releasedBy: string | null = null,
): SerializedAsset {
  return {
    id: row.id,
    ticketId: row.ticketId,
    venueCode: row.venueId,
    mode: row.mode as SerializedAsset["mode"],
    patron: { name: row.patronName, phone: row.patronPhone },
    fields: (row.fields ?? {}) as Record<string, string | number | boolean>,
    photos: (row.photos ?? []) as string[],
    intakeAt: row.intakeAt.getTime(),
    handler: row.handlerName,
    status: row.status as "active" | "released",
    releasedAt: row.releasedAt ? row.releasedAt.getTime() : null,
    releasedBy,
    signature: signTicket(venueSecret, row.venueId, row.ticketId),
  };
}

function newSigningSecret(): string {
  return randomBytes(32).toString("hex");
}

export async function ensureVenue(code: string, name?: string): Promise<void> {
  const displayName = name ?? VENUE_DEFAULTS[code] ?? code;
  // Demo venues come with a known type so the handler app shows the right
  // tiles immediately. Unknown venues fall back to the schema default ("other")
  // and the owner picks a type from settings.
  const venueType = VENUE_TYPE_DEFAULTS[code];
  await db
    .insert(venuesTable)
    .values({
      id: code,
      name: displayName,
      signingSecret: newSigningSecret(),
      ...(venueType ? { venueType } : {}),
    })
    .onConflictDoNothing({ target: venuesTable.id });
}

export async function getVenueSigningSecret(code: string): Promise<string> {
  const [row] = await db
    .select({ secret: venuesTable.signingSecret })
    .from(venuesTable)
    .where(eq(venuesTable.id, code))
    .limit(1);
  if (!row) {
    throw new Error(`Venue ${code} not found when loading signing secret`);
  }
  return row.secret;
}

export async function rotateVenueSigningSecret(code: string): Promise<string> {
  const next = newSigningSecret();
  const updated = await db
    .update(venuesTable)
    .set({ signingSecret: next })
    .where(eq(venuesTable.id, code))
    .returning({ secret: venuesTable.signingSecret });
  if (updated.length === 0) {
    throw new Error(`Venue ${code} not found when rotating signing secret`);
  }
  return updated[0].secret;
}

export async function ensureHandler(
  venueCode: string,
  email: string,
  name: string,
): Promise<string> {
  const inserted = await db
    .insert(handlersTable)
    .values({ venueId: venueCode, email, name })
    .onConflictDoNothing()
    .returning({ id: handlersTable.id });
  if (inserted[0]) return inserted[0].id;
  const [existing] = await db
    .select({ id: handlersTable.id })
    .from(handlersTable)
    .where(and(eq(handlersTable.venueId, venueCode), eq(handlersTable.email, email)))
    .limit(1);
  if (!existing) throw new Error(`Handler lookup failed for ${email}`);
  return existing.id;
}

const TICKET_PREFIX: Record<string, string> = {
  vehicles: "VAL",
  baggage: "BAG",
  cloakrooms: "CLK",
  bags: "RET",
};

function genTicketId(mode: string): string {
  const prefix = TICKET_PREFIX[mode] ?? "TAG";
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${n}`;
}

export async function seedVenueIfEmpty(venueCode: string): Promise<void> {
  if (!DEMO_VENUE_CODES.has(venueCode)) return;
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(assetsTable)
    .where(eq(assetsTable.venueId, venueCode));
  if (count > 0) return;
  const seedHandlerId = await ensureHandler(
    venueCode,
    "demo-seed@claimtagx.local",
    "Demo Seeder",
  );
  const now = Date.now();
  const rows = buildSeedAssets().map((s) => ({
    venueId: venueCode,
    ticketId: s.ticketId,
    mode: s.mode,
    patronName: s.patronName,
    patronPhone: s.patronPhone,
    fields: s.fields,
    photos: s.photos,
    handlerName: s.handlerName,
    handlerId: seedHandlerId,
    status: s.status,
    intakeAt: new Date(now - s.intakeAtOffsetMs),
  }));
  const inserted = await db
    .insert(assetsTable)
    .values(rows)
    .onConflictDoNothing()
    .returning({ id: assetsTable.id, intakeAt: assetsTable.intakeAt });
  if (inserted.length > 0) {
    await db.insert(eventsTable).values(
      inserted.map((row) => ({
        venueId: venueCode,
        assetId: row.id,
        handlerId: seedHandlerId,
        type: "intake" as const,
        at: row.intakeAt,
        meta: { seed: true },
      })),
    );
  }
}

export async function createTicketId(
  venueCode: string,
  mode: string,
): Promise<string> {
  for (let i = 0; i < 8; i += 1) {
    const candidate = genTicketId(mode);
    const [exists] = await db
      .select({ id: assetsTable.id })
      .from(assetsTable)
      .where(
        and(eq(assetsTable.venueId, venueCode), eq(assetsTable.ticketId, candidate)),
      )
      .limit(1);
    if (!exists) return candidate;
  }
  // Fallback: append timestamp suffix
  return `${genTicketId(mode)}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}
