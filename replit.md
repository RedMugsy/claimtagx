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
