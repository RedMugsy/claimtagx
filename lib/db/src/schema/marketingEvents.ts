import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// One row per event from the marketing site. Anonymous visitors (no auth),
// so we identify them by a client-generated `anonymousId` stored in their
// browser. Attribution (UTM, referrer, landing path) is captured on first
// visit and sent with every subsequent event in the same browser session.
export const marketingEventsTable = pgTable(
  "marketing_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    event: text("event").notNull(), // e.g. industry_selected, cta_clicked, roi_calculated, pageview
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),

    // Stitching identifiers — let the sales team follow one visitor across events.
    anonymousId: text("anonymous_id"),
    sessionId: text("session_id"),

    // Where the event happened.
    path: text("path"),
    referrer: text("referrer"),
    landingPath: text("landing_path"),

    // Attribution (lifted from URL params at first visit, then attached to every event).
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmTerm: text("utm_term"),
    utmContent: text("utm_content"),

    // Server-side context (filled by the API route, not trusted from the client).
    ip: text("ip"),
    country: text("country"),
    region: text("region"),
    city: text("city"),
    userAgent: text("user_agent"),

    // Everything event-specific: industry, action, location, vertical, plan,
    // recommended_plan, estimated_monthly_waste, etc.
    properties: jsonb("properties").$type<Record<string, unknown>>(),
  },
  (t) => ({
    eventAtIdx: index("marketing_events_event_at_idx").on(t.event, t.at),
    anonymousIdAtIdx: index("marketing_events_anon_at_idx").on(t.anonymousId, t.at),
    sessionIdIdx: index("marketing_events_session_idx").on(t.sessionId),
    utmCampaignIdx: index("marketing_events_utm_campaign_idx").on(t.utmCampaign),
  }),
);

export type MarketingEventRow = typeof marketingEventsTable.$inferSelect;
export type InsertMarketingEventRow = typeof marketingEventsTable.$inferInsert;
