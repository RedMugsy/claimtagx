import {
  db,
  handlerVenuesTable,
  venueInvitesTable,
  venuesTable,
} from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { ensureVenue } from "./assets";
import { DEMO_INVITE_TOKENS, VENUE_DEFAULTS } from "./seed";

export interface MembershipRow {
  code: string;
  name: string;
  role: string;
}

export async function listMemberships(
  userId: string,
): Promise<MembershipRow[]> {
  const rows = await db
    .select({
      code: handlerVenuesTable.venueCode,
      role: handlerVenuesTable.role,
      name: venuesTable.name,
    })
    .from(handlerVenuesTable)
    .innerJoin(venuesTable, eq(venuesTable.id, handlerVenuesTable.venueCode))
    .where(eq(handlerVenuesTable.handlerUserId, userId));
  return rows.map((r) => ({ code: r.code, name: r.name, role: r.role }));
}

export async function isMember(
  userId: string,
  venueCode: string,
): Promise<boolean> {
  const [row] = await db
    .select({ code: handlerVenuesTable.venueCode })
    .from(handlerVenuesTable)
    .where(
      and(
        eq(handlerVenuesTable.handlerUserId, userId),
        eq(handlerVenuesTable.venueCode, venueCode),
      ),
    )
    .limit(1);
  return !!row;
}

export async function removeMembership(
  userId: string,
  venueCode: string,
): Promise<void> {
  await db
    .delete(handlerVenuesTable)
    .where(
      and(
        eq(handlerVenuesTable.handlerUserId, userId),
        eq(handlerVenuesTable.venueCode, venueCode),
      ),
    );
}

export type RedeemResult =
  | { ok: true; venue: MembershipRow }
  | { ok: false; status: number; error: string };

export async function redeemInvite(
  userId: string,
  rawToken: string,
): Promise<RedeemResult> {
  const token = rawToken.trim();
  if (!token) {
    return { ok: false, status: 400, error: "Invite token is required" };
  }
  await ensureDemoInvitesSeeded();
  const [invite] = await db
    .select()
    .from(venueInvitesTable)
    .where(eq(venueInvitesTable.token, token))
    .limit(1);
  if (!invite) {
    return { ok: false, status: 404, error: "Invite token not recognized" };
  }
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    return { ok: false, status: 410, error: "Invite token has expired" };
  }
  if (invite.useCount >= invite.maxUses) {
    return { ok: false, status: 410, error: "Invite token already used" };
  }
  const venueCode = invite.venueCode;
  const role = invite.role || "handler";
  await ensureVenue(venueCode);

  const inserted = await db
    .insert(handlerVenuesTable)
    .values({ handlerUserId: userId, venueCode, role })
    .onConflictDoNothing()
    .returning({ code: handlerVenuesTable.venueCode });

  if (inserted.length > 0) {
    await db
      .update(venueInvitesTable)
      .set({ useCount: sql`${venueInvitesTable.useCount} + 1` })
      .where(eq(venueInvitesTable.token, token));
  }

  const [venue] = await db
    .select({ name: venuesTable.name })
    .from(venuesTable)
    .where(eq(venuesTable.id, venueCode))
    .limit(1);

  return {
    ok: true,
    venue: { code: venueCode, name: venue?.name ?? venueCode, role },
  };
}

let demoInvitesSeeded = false;

export async function ensureDemoInvitesSeeded(): Promise<void> {
  if (demoInvitesSeeded) return;
  for (const [code, name] of Object.entries(VENUE_DEFAULTS)) {
    await ensureVenue(code, name);
  }
  const rows = Object.entries(DEMO_INVITE_TOKENS).map(([code, token]) => ({
    token,
    venueCode: code,
    role: "handler",
    maxUses: 1_000_000,
    useCount: 0,
    isDemo: "true",
  }));
  if (rows.length > 0) {
    await db
      .insert(venueInvitesTable)
      .values(rows)
      .onConflictDoNothing({ target: venueInvitesTable.token });
  }
  demoInvitesSeeded = true;
}

export interface AvailableDemoVenue {
  code: string;
  name: string;
  inviteToken: string;
}

export async function listDemoVenues(): Promise<AvailableDemoVenue[]> {
  await ensureDemoInvitesSeeded();
  return Object.entries(DEMO_INVITE_TOKENS).map(([code, inviteToken]) => ({
    code,
    name: VENUE_DEFAULTS[code] ?? code,
    inviteToken,
  }));
}
