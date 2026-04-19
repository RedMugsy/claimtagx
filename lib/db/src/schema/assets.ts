import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { venuesTable } from "./venues";
import { handlersTable } from "./handlers";

export const assetsTable = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueId: text("venue_id")
      .notNull()
      .references(() => venuesTable.id, { onDelete: "cascade" }),
    ticketId: text("ticket_id").notNull(),
    mode: text("mode").notNull(),
    patronName: text("patron_name").notNull(),
    patronPhone: text("patron_phone").notNull().default(""),
    fields: jsonb("fields").notNull().$type<Record<string, string | number | boolean>>().default({}),
    photos: jsonb("photos").notNull().$type<string[]>().default([]),
    handlerId: uuid("handler_id").references(() => handlersTable.id, {
      onDelete: "set null",
    }),
    handlerName: text("handler_name").notNull(),
    status: text("status").notNull().default("active"),
    intakeAt: timestamp("intake_at", { withTimezone: true }).notNull().defaultNow(),
    releasedAt: timestamp("released_at", { withTimezone: true }),
  },
  (t) => ({
    uniqVenueTicket: uniqueIndex("assets_venue_ticket_uniq").on(t.venueId, t.ticketId),
    venueModeIdx: index("assets_venue_mode_idx").on(t.venueId, t.mode),
  }),
);

export type AssetRow = typeof assetsTable.$inferSelect;
export type InsertAssetRow = typeof assetsTable.$inferInsert;
