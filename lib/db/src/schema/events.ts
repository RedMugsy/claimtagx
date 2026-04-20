import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { venuesTable } from "./venues";
import { handlersTable } from "./handlers";
import { assetsTable } from "./assets";

export const eventsTable = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  venueId: text("venue_id")
    .notNull()
    .references(() => venuesTable.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id").references(() => assetsTable.id, {
    onDelete: "cascade",
  }),
  handlerId: uuid("handler_id").references(() => handlersTable.id, {
    onDelete: "set null",
  }),
  type: text("type").notNull(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  meta: jsonb("meta").$type<Record<string, unknown>>(),
});

export type EventRow = typeof eventsTable.$inferSelect;
export type InsertEventRow = typeof eventsTable.$inferInsert;
