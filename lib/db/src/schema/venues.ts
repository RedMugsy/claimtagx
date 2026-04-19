import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const venuesTable = pgTable("venues", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  // Per-venue secret used to HMAC-sign claim-tag QR codes. Storing it on the
  // venue (instead of using one global server secret) means a leaked or
  // suspected-leaked key only invalidates that one venue's outstanding tags
  // and can be rotated independently.
  signingSecret: text("signing_secret")
    .notNull()
    .$defaultFn(() => randomBytes(32).toString("hex"))
    .default(
      sql`md5(random()::text || clock_timestamp()::text) || md5(random()::text || clock_timestamp()::text)`,
    ),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Venue = typeof venuesTable.$inferSelect;
export type InsertVenue = typeof venuesTable.$inferInsert;
