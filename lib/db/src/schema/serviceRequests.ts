import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { venuesTable } from "./venues";
import { assetsTable } from "./assets";

export const serviceRequestsTable = pgTable(
  "service_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueCode: text("venue_code")
      .notNull()
      .references(() => venuesTable.id, { onDelete: "cascade" }),
    ticketId: text("ticket_id").notNull(),
    assetId: uuid("asset_id").references(() => assetsTable.id, {
      onDelete: "set null",
    }),
    kind: text("kind").notNull(),
    notes: text("notes").notNull().default(""),
    status: text("status").notNull().default("open"),
    requestedByName: text("requested_by_name").notNull().default("Patron"),
    claimedByUserId: text("claimed_by_user_id"),
    claimedByName: text("claimed_by_name"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => ({
    byVenueStatus: index("service_requests_venue_status_idx").on(
      t.venueCode,
      t.status,
    ),
  }),
);

export type ServiceRequest = typeof serviceRequestsTable.$inferSelect;
export type InsertServiceRequest = typeof serviceRequestsTable.$inferInsert;
