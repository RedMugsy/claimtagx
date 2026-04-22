import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { venuesTable } from "./venues";

export const shiftsTable = pgTable(
  "shifts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueCode: text("venue_code")
      .notNull()
      .references(() => venuesTable.id, { onDelete: "cascade" }),
    handlerUserId: text("handler_user_id").notNull(),
    handlerEmail: text("handler_email").notNull(),
    handlerName: text("handler_name").notNull(),
    role: text("role").notNull().default("handler"),
    targetMinutes: integer("target_minutes").notNull().default(480),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    // How the shift was ended. NULL while the shift is open; "manual" when the
    // handler tapped End, "auto-timeout" when the safety net closed a forgotten
    // shift older than the configured cap.
    endReason: text("end_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    // A handler can only ever have ONE active shift at a time, across all
    // venues. Enforced in the DB so race conditions can't create duplicates.
    activeUniq: uniqueIndex("shifts_active_handler_uniq")
      .on(t.handlerUserId)
      .where(sql`${t.endedAt} is null`),
    byVenue: index("shifts_venue_idx").on(t.venueCode, t.startedAt),
  }),
);

export type Shift = typeof shiftsTable.$inferSelect;
export type InsertShift = typeof shiftsTable.$inferInsert;
