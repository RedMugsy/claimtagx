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
- `/` — Homepage (hero, problem, how it works, features, industries, pricing, comparison, CTA, footer)
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
- `src/components/sections/` — All homepage sections as individual components

### API Server (`artifacts/api-server`)
- Express 5 API server at `/api`

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
