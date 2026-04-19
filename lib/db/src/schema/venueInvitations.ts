import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { venuesTable } from "./venues";

// Email-targeted invitations created by venue owners. Distinct from
// `venue_invites` (which holds shareable redemption tokens used by the legacy
// demo flow). Each row represents a single user being invited to a single
// venue and progresses through pending -> accepted/declined/revoked.
export const venueInvitationsTable = pgTable("venue_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  venueCode: text("venue_code")
    .notNull()
    .references(() => venuesTable.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull().default("handler"),
  invitedByUserId: text("invited_by_user_id").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  acceptedByUserId: text("accepted_by_user_id"),
});

export type VenueInvitation = typeof venueInvitationsTable.$inferSelect;
export type InsertVenueInvitation =
  typeof venueInvitationsTable.$inferInsert;
