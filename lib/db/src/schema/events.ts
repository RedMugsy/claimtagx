import {
  bigserial,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { venuesTable } from "./venues";
import { handlersTable } from "./handlers";
import { assetsTable } from "./assets";

export const eventsTable = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Monotonically-increasing per-row sequence used as the SSE `id:` so
    // clients can reconnect with `Last-Event-ID` and ask the server to
    // replay just the events they missed instead of refetching the whole
    // active custody list.
    seq: bigserial("seq", { mode: "number" }).notNull(),
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
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  },
  (t) => ({
    venueSeqIdx: index("events_venue_seq_idx").on(t.venueId, t.seq),
  }),
);

export type EventRow = typeof eventsTable.$inferSelect;
export type InsertEventRow = typeof eventsTable.$inferInsert;
