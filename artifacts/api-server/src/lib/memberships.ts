import {
  db,
  handlerVenuesTable,
  venueInvitationsTable,
  venueInvitesTable,
  venuesTable,
} from "@workspace/db";
import { and, eq, ne, sql } from "drizzle-orm";
import { ensureVenue } from "./assets";
import { DEMO_INVITE_TOKENS, VENUE_DEFAULTS } from "./seed";

export interface MembershipRow {
  code: string;
  name: string;
  role: string;
}

export const OWNER_ROLES = ["owner", "supervisor"] as const;
export type OwnerRole = (typeof OWNER_ROLES)[number];

export function isOwnerRole(role: string | undefined | null): boolean {
  return !!role && (OWNER_ROLES as readonly string[]).includes(role);
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
  await ensureVenue(venueCode);
  // Bootstrap ownership: the very first member of a venue becomes its owner
  // so there is always somebody who can administer access. Subsequent joiners
  // get whatever role the invite specified (default "handler").
  const [{ memberCount }] = await db
    .select({ memberCount: sql<number>`count(*)::int` })
    .from(handlerVenuesTable)
    .where(eq(handlerVenuesTable.venueCode, venueCode));
  const role = memberCount === 0 ? "owner" : invite.role || "handler";

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

// ---------------------------------------------------------------------------
// Email-targeted invitations (owner-managed access control).
// ---------------------------------------------------------------------------

export interface PendingInvitation {
  id: string;
  venueCode: string;
  venueName: string;
  email: string;
  role: string;
  invitedByUserId: string;
  createdAt: number;
}

export interface VenueMember {
  userId: string;
  role: string;
  joinedAt: number;
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function getMembership(
  userId: string,
  venueCode: string,
): Promise<MembershipRow | null> {
  const [row] = await db
    .select({
      code: handlerVenuesTable.venueCode,
      role: handlerVenuesTable.role,
      name: venuesTable.name,
    })
    .from(handlerVenuesTable)
    .innerJoin(venuesTable, eq(venuesTable.id, handlerVenuesTable.venueCode))
    .where(
      and(
        eq(handlerVenuesTable.handlerUserId, userId),
        eq(handlerVenuesTable.venueCode, venueCode),
      ),
    )
    .limit(1);
  return row ? { code: row.code, name: row.name, role: row.role } : null;
}

export async function listPendingInvitationsForEmail(
  email: string,
): Promise<PendingInvitation[]> {
  const normalized = normalizeEmail(email);
  if (!normalized) return [];
  const rows = await db
    .select({
      id: venueInvitationsTable.id,
      venueCode: venueInvitationsTable.venueCode,
      email: venueInvitationsTable.email,
      role: venueInvitationsTable.role,
      invitedByUserId: venueInvitationsTable.invitedByUserId,
      createdAt: venueInvitationsTable.createdAt,
      venueName: venuesTable.name,
    })
    .from(venueInvitationsTable)
    .innerJoin(
      venuesTable,
      eq(venuesTable.id, venueInvitationsTable.venueCode),
    )
    .where(
      and(
        eq(venueInvitationsTable.email, normalized),
        eq(venueInvitationsTable.status, "pending"),
      ),
    );
  return rows.map((r) => ({
    id: r.id,
    venueCode: r.venueCode,
    venueName: r.venueName,
    email: r.email,
    role: r.role,
    invitedByUserId: r.invitedByUserId,
    createdAt: r.createdAt.getTime(),
  }));
}

export async function listPendingInvitationsForVenue(
  venueCode: string,
): Promise<PendingInvitation[]> {
  const rows = await db
    .select({
      id: venueInvitationsTable.id,
      venueCode: venueInvitationsTable.venueCode,
      email: venueInvitationsTable.email,
      role: venueInvitationsTable.role,
      invitedByUserId: venueInvitationsTable.invitedByUserId,
      createdAt: venueInvitationsTable.createdAt,
      venueName: venuesTable.name,
    })
    .from(venueInvitationsTable)
    .innerJoin(
      venuesTable,
      eq(venuesTable.id, venueInvitationsTable.venueCode),
    )
    .where(
      and(
        eq(venueInvitationsTable.venueCode, venueCode),
        eq(venueInvitationsTable.status, "pending"),
      ),
    );
  return rows.map((r) => ({
    id: r.id,
    venueCode: r.venueCode,
    venueName: r.venueName,
    email: r.email,
    role: r.role,
    invitedByUserId: r.invitedByUserId,
    createdAt: r.createdAt.getTime(),
  }));
}

export async function listVenueMembers(
  venueCode: string,
): Promise<VenueMember[]> {
  const rows = await db
    .select({
      userId: handlerVenuesTable.handlerUserId,
      role: handlerVenuesTable.role,
      joinedAt: handlerVenuesTable.joinedAt,
    })
    .from(handlerVenuesTable)
    .where(eq(handlerVenuesTable.venueCode, venueCode));
  return rows.map((r) => ({
    userId: r.userId,
    role: r.role,
    joinedAt: r.joinedAt.getTime(),
  }));
}

export type CreateInvitationResult =
  | { ok: true; invitation: PendingInvitation }
  | { ok: false; status: number; error: string };

export async function createInvitation(params: {
  venueCode: string;
  email: string;
  role: string;
  invitedByUserId: string;
}): Promise<CreateInvitationResult> {
  const email = normalizeEmail(params.email);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 400, error: "Valid email is required" };
  }
  const role = params.role || "handler";
  if (!["handler", "supervisor", "owner"].includes(role)) {
    return { ok: false, status: 400, error: "Unknown role" };
  }
  await ensureVenue(params.venueCode);
  // Reject duplicates for already-pending invites for the same email at the
  // same venue. (Already-accepted invites are not rejected here — once
  // accepted they become a `handler_venues` row, which is a separate
  // concern; re-inviting an existing member is a no-op handled elsewhere.)
  const existingPending = await db
    .select({ id: venueInvitationsTable.id })
    .from(venueInvitationsTable)
    .where(
      and(
        eq(venueInvitationsTable.venueCode, params.venueCode),
        eq(venueInvitationsTable.email, email),
        eq(venueInvitationsTable.status, "pending"),
      ),
    )
    .limit(1);
  if (existingPending.length > 0) {
    return {
      ok: false,
      status: 409,
      error: "An invitation for that email is already pending",
    };
  }
  const [row] = await db
    .insert(venueInvitationsTable)
    .values({
      venueCode: params.venueCode,
      email,
      role,
      invitedByUserId: params.invitedByUserId,
      status: "pending",
    })
    .returning();
  const [{ name }] = await db
    .select({ name: venuesTable.name })
    .from(venuesTable)
    .where(eq(venuesTable.id, params.venueCode))
    .limit(1);
  return {
    ok: true,
    invitation: {
      id: row.id,
      venueCode: row.venueCode,
      venueName: name,
      email: row.email,
      role: row.role,
      invitedByUserId: row.invitedByUserId,
      createdAt: row.createdAt.getTime(),
    },
  };
}

export type AcceptInvitationResult =
  | { ok: true; venue: MembershipRow }
  | { ok: false; status: number; error: string };

export async function acceptInvitation(params: {
  invitationId: string;
  userId: string;
  userEmail: string;
}): Promise<AcceptInvitationResult> {
  const email = normalizeEmail(params.userEmail);
  const [invite] = await db
    .select()
    .from(venueInvitationsTable)
    .where(eq(venueInvitationsTable.id, params.invitationId))
    .limit(1);
  if (!invite) {
    return { ok: false, status: 404, error: "Invitation not found" };
  }
  if (invite.status !== "pending") {
    return { ok: false, status: 410, error: "Invitation is no longer pending" };
  }
  if (invite.email !== email) {
    return {
      ok: false,
      status: 403,
      error: "Invitation is addressed to a different email",
    };
  }
  await ensureVenue(invite.venueCode);
  await db
    .insert(handlerVenuesTable)
    .values({
      handlerUserId: params.userId,
      venueCode: invite.venueCode,
      role: invite.role || "handler",
    })
    .onConflictDoNothing();
  await db
    .update(venueInvitationsTable)
    .set({
      status: "accepted",
      respondedAt: new Date(),
      acceptedByUserId: params.userId,
    })
    .where(eq(venueInvitationsTable.id, invite.id));
  const [venue] = await db
    .select({ name: venuesTable.name })
    .from(venuesTable)
    .where(eq(venuesTable.id, invite.venueCode))
    .limit(1);
  return {
    ok: true,
    venue: {
      code: invite.venueCode,
      name: venue?.name ?? invite.venueCode,
      role: invite.role || "handler",
    },
  };
}

export type DeclineInvitationResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function declineInvitation(params: {
  invitationId: string;
  userEmail: string;
}): Promise<DeclineInvitationResult> {
  const email = normalizeEmail(params.userEmail);
  const [invite] = await db
    .select()
    .from(venueInvitationsTable)
    .where(eq(venueInvitationsTable.id, params.invitationId))
    .limit(1);
  if (!invite) {
    return { ok: false, status: 404, error: "Invitation not found" };
  }
  if (invite.status !== "pending") {
    return { ok: false, status: 410, error: "Invitation is no longer pending" };
  }
  if (invite.email !== email) {
    return {
      ok: false,
      status: 403,
      error: "Invitation is addressed to a different email",
    };
  }
  await db
    .update(venueInvitationsTable)
    .set({ status: "declined", respondedAt: new Date() })
    .where(eq(venueInvitationsTable.id, invite.id));
  return { ok: true };
}

export async function revokeInvitation(params: {
  invitationId: string;
  venueCode: string;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const [invite] = await db
    .select()
    .from(venueInvitationsTable)
    .where(eq(venueInvitationsTable.id, params.invitationId))
    .limit(1);
  if (!invite || invite.venueCode !== params.venueCode) {
    return { ok: false, status: 404, error: "Invitation not found" };
  }
  if (invite.status !== "pending") {
    return { ok: false, status: 410, error: "Invitation is no longer pending" };
  }
  await db
    .update(venueInvitationsTable)
    .set({ status: "revoked", respondedAt: new Date() })
    .where(eq(venueInvitationsTable.id, invite.id));
  return { ok: true };
}

export async function revokeMember(params: {
  venueCode: string;
  targetUserId: string;
  actingUserId: string;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (params.targetUserId === params.actingUserId) {
    return {
      ok: false,
      status: 400,
      error: "You cannot revoke your own access from here; leave the venue instead",
    };
  }
  const [target] = await db
    .select({ role: handlerVenuesTable.role })
    .from(handlerVenuesTable)
    .where(
      and(
        eq(handlerVenuesTable.handlerUserId, params.targetUserId),
        eq(handlerVenuesTable.venueCode, params.venueCode),
      ),
    )
    .limit(1);
  if (!target) {
    return { ok: false, status: 404, error: "Member not found" };
  }
  // Don't let the last owner be removed — there must always be at least one
  // owner who can administer the venue.
  if (target.role === "owner") {
    const [{ otherOwners }] = await db
      .select({ otherOwners: sql<number>`count(*)::int` })
      .from(handlerVenuesTable)
      .where(
        and(
          eq(handlerVenuesTable.venueCode, params.venueCode),
          eq(handlerVenuesTable.role, "owner"),
          ne(handlerVenuesTable.handlerUserId, params.targetUserId),
        ),
      );
    if (otherOwners === 0) {
      return {
        ok: false,
        status: 400,
        error: "Cannot remove the last owner of the venue",
      };
    }
  }
  await db
    .delete(handlerVenuesTable)
    .where(
      and(
        eq(handlerVenuesTable.handlerUserId, params.targetUserId),
        eq(handlerVenuesTable.venueCode, params.venueCode),
      ),
    );
  return { ok: true };
}
