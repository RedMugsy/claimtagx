import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { venuesTable } from "./venues";

// Who is currently "tuned in" to a venue's intercom channel. Joining is
// explicit so handlers don't get blasted by audio in their pocket. Rows are
// removed when the user leaves or the row goes stale (last seen > 2 minutes).
export const intercomPresenceTable = pgTable(
  "intercom_presence",
  {
    venueCode: text("venue_code")
      .notNull()
      .references(() => venuesTable.id, { onDelete: "cascade" }),
    handlerUserId: text("handler_user_id").notNull(),
    handlerName: text("handler_name").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.venueCode, t.handlerUserId] }),
  }),
);

// One row per push-to-talk transmission. Audio is stored as base64 inline to
// avoid spinning up an object store for what is, in practice, a few seconds
// of voice. Old rows are pruned on read.
export const intercomTransmissionsTable = pgTable(
  "intercom_transmissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueCode: text("venue_code")
      .notNull()
      .references(() => venuesTable.id, { onDelete: "cascade" }),
    senderUserId: text("sender_user_id").notNull(),
    senderName: text("sender_name").notNull(),
    audioBase64: text("audio_base64").notNull(),
    mimeType: text("mime_type").notNull().default("audio/webm"),
    durationMs: integer("duration_ms").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    byVenueTime: index("intercom_transmissions_venue_created_idx").on(
      t.venueCode,
      t.createdAt,
    ),
  }),
);

export type IntercomTransmission =
  typeof intercomTransmissionsTable.$inferSelect;
export type InsertIntercomTransmission =
  typeof intercomTransmissionsTable.$inferInsert;
export type IntercomPresence = typeof intercomPresenceTable.$inferSelect;
