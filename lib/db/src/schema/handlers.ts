import { pgTable, text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { venuesTable } from "./venues";

export const handlersTable = pgTable(
  "handlers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueId: text("venue_id")
      .notNull()
      .references(() => venuesTable.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqVenueEmail: uniqueIndex("handlers_venue_email_uniq").on(t.venueId, t.email),
  }),
);

export type Handler = typeof handlersTable.$inferSelect;
export type InsertHandler = typeof handlersTable.$inferInsert;
