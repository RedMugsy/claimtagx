import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { venuesTable } from "./venues";

export const handlerVenuesTable = pgTable(
  "handler_venues",
  {
    handlerUserId: text("handler_user_id").notNull(),
    venueCode: text("venue_code")
      .notNull()
      .references(() => venuesTable.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("handler"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.handlerUserId, t.venueCode] }),
  }),
);

export type HandlerVenue = typeof handlerVenuesTable.$inferSelect;
export type InsertHandlerVenue = typeof handlerVenuesTable.$inferInsert;
