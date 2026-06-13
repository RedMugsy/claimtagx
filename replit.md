# ClaimTagX Marketing Website

## Overview

pnpm workspace monorepo using TypeScript. Contains the ClaimTagX marketing website (React + Vite) and a shared Express API server.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### ClaimTagX Marketing Site (`artifacts/claimtagx`)
- **Framework**: React + Vite
- **Styling**: Tailwind CSS with custom ClaimTagX brand tokens
- **Animations**: Framer Motion
- **Routing**: Wouter
- **Preview path**: `/` (root)

**Brand System:**
- Obsidian: `#0B0F19` (backgrounds)
- Lime: `#C6F24E` (CTAs, accents)
- Steel: `#1F2937` (cards)
- Fonts: Inter (sans) + JetBrains Mono (mono) via Google Fonts

**Pages:**
- `/` — Homepage (hero, trust strip, problem, price-per-ticket parity, interactive how-it-works (`#how`, ProductDemo.tsx), features, stats, industries, ROI calculator, comparison, pricing teaser, FAQ, CTA, footer). All signup CTAs use the wording "Start free" (free-forever plan; never "trial" in buttons). Per-ticket "~5¢, same as paper" framing is used in the hero chips, parity section, comparison table, pricing cards, and FAQ.
- `/solutions/:slug` — Vertical solution pages; content lives in `src/lib/solutions.tsx`, template in `src/pages/Solution.tsx`. Linked from Industries cards and footer; listed in `public/sitemap.xml`. Each renders vertical-specific delivery-channel chips and BreadcrumbList JSON-LD. A vertical can override the primary CTA via `primaryCta` (airlines routes to sales instead of self-serve signup).
  - **Taxonomy (Ali's):** *single asset class* (one flow): valet, dry-cleaning, luggage, repair, airlines. *Multi-flow venues* (one buyer, several custody flows): hotels, clubs-restaurants, beach-clubs. Homepage Industries grid shows multi-flow first with a tag badge per card.
  - Hero images for hotels/clubs/beach-clubs/airlines currently reuse valet/luggage placeholders — Ali to supply bespoke images.
- `/demo-ticket` — Sample guest ticket page (what patrons see; no app, no account). Reached via a scannable QR (`src/assets/demo-ticket-qr.svg`, generated with the `qrcode` devDependency) in the homepage demo section.

**Channel messaging:** supported issuance/verification channels are QR Code, NFC, BLE, SMS, WhatsApp, Email, In-app push. Homepage `OmniChannel.tsx` section ("No signal. No app. No problem.") dramatizes offline-first + no-patron-app and lists all channels. The `/price` feature matrix has "Issuance & transfer" and "Input methods" groups; metered rows (SMS/WhatsApp, AI-assisted capture) carry an asterisk with the note beside the row, not in a footer.

**Core hero message:** "A paper ticket can only prove a claim exists. ClaimTagX shows you everything that happens after — at the same price per ticket as paper." Features section is framed as "The Custody Operating System" (pillars: guest experience, operational visibility, control).

**Windows dev note:** the pnpm overrides blocking platform binaries exclude win32-x64 variants (esbuild, rollup, lightningcss, tailwind oxide) so the site builds on Windows; all other non-linux platforms remain blocked for slim Replit installs.

**Analytics — three-destination fanout:** marketing-site events live in `src/lib/analytics.ts`. Consent-gated against the cookie banner. Each destination is independent — every helper is a safe no-op when its env var is unset. Configure via build-time env vars:
- `VITE_POSTHOG_KEY` — PostHog project key. Defaults host to `https://us.i.posthog.com`; override with `VITE_POSTHOG_HOST` for EU.
- `VITE_GA_ID` — Google Analytics 4 measurement ID (G-XXXXXXX). When set, the gtag script is injected; IP anonymization on, ad personalization off.
- `VITE_CLAIMTAGX_EVENTS_ENDPOINT` — first-party endpoint for the sales team's portal. Marketing site POSTs events via `navigator.sendBeacon` (with `fetch` keepalive fallback).

Each `track(event, properties)` call fans out to all three destinations: PostHog for funnels/replay, GA4 for source/medium/UTM/geo, the ClaimTagX backend for the sales team's portal view.

**First-visit attribution** is captured once per session and attached to every backend event:
- `landing_path` (path + query of the very first page in the session)
- `referrer` (`document.referrer` on first hit)
- `utm_source` / `utm_medium` / `utm_campaign` / `utm_term` / `utm_content` (lifted from URL params)

**Identifiers:**
- `anonymous_id` — UUID in `localStorage` (persists across visits)
- `session_id` — UUID in `sessionStorage` (resets per tab session)

Events emitted (marketing-site only — the app/onboarding funnel emits separately):
- `industry_selected` — `{ industry, label, location: 'hero' }` — fires on the "I run a…" pill clicks
- `cta_clicked` — `{ action, location, vertical?, plan?, recommended_plan?, estimated_monthly_waste? }`
  - `action`: `start_free` · `book_demo` · `talk_to_sales` · `request_security_docs` · `see_full_pricing`
  - `location`: `nav` · `nav_mobile` · `hero` · `sticky_mobile` · `pricing_teaser` · `roi_calculator` · `final_cta` · `solution_page` · `demo_ticket` · `security_hero` · `security_enterprise_cta`
- `roi_calculated` — `{ items_per_day, days_per_week, items_per_month, estimated_monthly_waste, recommended_plan }` — debounced (1.5s after slider settles), only fires if the user actually interacted.
- Pageviews auto-captured by PostHog and GA4 (works with wouter SPA routing).

**Backend pipeline (`/api/marketing/events`):**
- Schema: `marketing_events` table (`lib/db/src/schema/marketingEvents.ts`) — one row per event, indexed on (event, at), (anonymous_id, at), (session_id), (utm_campaign).
- Route: `artifacts/api-server/src/routes/marketing.ts` — POST, anonymous (no auth), Zod-validated, properties capped at 4 KB, server-side capture of IP, user-agent, and Cloudflare geo headers (`CF-IPCountry`, `CF-Region`, `CF-IPCity`) when present.
- Migration: `pnpm --filter @workspace/db run push` after pulling these changes pushes the new table.
- CORS: the api-server CORS allowlist is built from `CORS_ALLOWED_ORIGINS` — add `https://claimtagx.com,https://www.claimtagx.com` there. The marketing site sends with `credentials: 'omit'`, so it does not need to ride the credentialed allowlist semantics.

**Sales-team portal dashboard:** pending — needs Ali to confirm the portal's framework/design system so the component drops in cleanly.
- `/privacy` — Privacy Policy
- `/terms` — Terms of Service
- `/gdpr` — GDPR
- `/dpa` — Data Processing Addendum
- `/cookies` — Cookie Policy
- `/aup` — Acceptable Use Policy

**Components:**
- `src/components/Nav.tsx` — Fixed nav with scroll effect + hamburger menu
- `src/components/Footer.tsx` — Full footer with links
- `src/components/CookieBanner.tsx` — Cookie consent banner (localStorage)
- `src/components/SEO.tsx` — SEO meta tags
- `src/components/StickyCTA.tsx` — Mobile-only sticky signup bar (appears after hero scroll)
- `src/components/sections/` — All homepage sections as individual components
  - `ROICalculator.tsx` — interactive paper-cost calculator (sliders → monthly waste estimate); accepts per-vertical defaults via props
  - `PricePerTicket.tsx` — price-parity section ("same ~5¢ as paper, with visibility"); used on home + solution pages
  - `PricingTeaser.tsx` — 3-card homepage pricing summary linking to `/price`
  - `FAQ.tsx` — accordion FAQ; injects FAQPage JSON-LD for SEO

**Content rules:**
- No fabricated social proof: no fake client logos, invented usage stats, or fake testimonials.
  TrustStrip shows real capabilities; Stats shows true product facts only.
- `index.html` carries the canonical SEO meta (title, description, OG, JSON-LD) since the site is a client-rendered SPA.

### API Server (`artifacts/api-server`)
- Express 5 API server at `/api`
- Endpoints:
  - `GET /api/healthz`
  - `GET /api/venues/{venueCode}/assets` — list custody assets (auto-creates venue and seeds 8 demo assets if empty)
  - `POST /api/venues/{venueCode}/assets` — intake (auto-issues ticket id from mode prefix)
  - `GET /api/venues/{venueCode}/assets/{ticketId}` — case-insensitive lookup
  - `POST /api/venues/{venueCode}/assets/{ticketId}/release` — release an active ticket
- Persistence in Postgres via Drizzle (`@workspace/db`):
  - `venues` (id = code, name, created_at)
  - `handlers` (id, venue_id, email, name) — find-or-created by (venue, email) on intake/release
  - `assets` (id, venue_id, ticket_id, mode, patron_name/phone, fields jsonb, photos jsonb, handler_id/name, status, intake_at, released_at)
  - `events` (id, venue_id, asset_id, handler_id, type [intake|release], at, meta) — append-only audit trail

### Handler App (`artifacts/handler-app`)
- React + Vite handler PWA at `/handler/`
- State via React Query against the API server (`useStore` in `src/lib/store.tsx`); session + selected mode persisted in localStorage
- All intake / custody / release flows hit real endpoints; tickets survive refreshes and device swaps
- Demo seed loads automatically on first list call per venue code (`VLT-001`, `BAG-002`, `CLK-003`, `RET-004`, or any new code)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## CTA Links

| Button | Links to |
|--------|----------|
| "Start free trial" | https://app.claimtagx.com/signup |
| "See how it works" | #how (smooth scroll) |
| "Contact sales" / "Talk to sales" | mailto:sales@claimtagx.com |

## Deployment Target

- Cloudflare Pages (static export) or Vercel
- Custom domain: claimtagx.com + www.claimtagx.com
- Build command: `pnpm --filter @workspace/claimtagx run build`
- Output directory: `artifacts/claimtagx/dist/public`

## Assets Needed from Ali

- Logo SVG files (primary, inverted, icon variants) — currently using text wordmark
- Favicon PNG set (16x16, 32x32, 180x180 apple-touch-icon)
- OG image (1200x630 PNG)
- Google Analytics 4 measurement ID
- Legal page content (privacy, terms, GDPR, DPA, cookies, AUP) — placeholders in use
- Calendly link for "Request demo" CTA
