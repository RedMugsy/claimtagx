import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { venuesTable } from "./venues";

export const messagesTable = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueCode: text("venue_code")
      .notNull()
      .references(() => venuesTable.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id").notNull(),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    byVenueTime: index("messages_venue_created_idx").on(
      t.venueCode,
      t.createdAt,
    ),
  }),
);

// Per-handler "last read" pointer used to compute unread counts. Storing a
// timestamp instead of marking each message keeps the table tiny — one row
// per (handler, venue) regardless of how chatty the channel is.
export const messageReadsTable = pgTable(
  "message_reads",
  {
    handlerUserId: text("handler_user_id").notNull(),
    venueCode: text("venue_code")
      .notNull()
      .references(() => venuesTable.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.handlerUserId, t.venueCode] }),
  }),
);

export type Message = typeof messagesTable.$inferSelect;
export type InsertMessage = typeof messagesTable.$inferInsert;
