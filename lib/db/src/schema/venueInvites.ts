import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { venuesTable } from "./venues";

export const venueInvitesTable = pgTable("venue_invites", {
  token: text("token").primaryKey(),
  venueCode: text("venue_code")
    .notNull()
    .references(() => venuesTable.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("handler"),
  maxUses: integer("max_uses").notNull().default(1),
  useCount: integer("use_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isDemo: text("is_demo").notNull().default("false"),
});

export type VenueInvite = typeof venueInvitesTable.$inferSelect;
export type InsertVenueInvite = typeof venueInvitesTable.$inferInsert;
