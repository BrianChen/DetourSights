# Detour Sights — Claude Code Guide

## Project Overview
Travel discovery web app built with Next.js 14 App Router. Users browse destinations and filter places within each destination by category.

## Tech Stack
- **Framework:** Next.js 14 (App Router, plain JS — no TypeScript)
- **Database:** PostgreSQL via Prisma ORM
- **Styling:** CSS Modules + CSS custom properties (design tokens in `app/globals.css`)
- **Fonts:** Playfair Display (`--font-display`) + Inter (`--font-body`) via `next/font/google`
- **Images:** Cloudinary (URLs stored in DB)

## Project Structure
```
app/
  layout.jsx                          # Root layout — fonts, Header
  page.jsx                            # Home page with SearchBar
  globals.css                         # Design tokens (CSS custom properties)
  [destinationSlug]/
    page.jsx                          # Destination page (server component)
    page.module.css
    [placeSlug]/
      page.jsx                        # Place detail page
      page.module.css
  api/                                # API routes
components/
  Header.jsx / Header.module.css
  SearchBar.jsx / SearchBar.module.css
  PlacesFilter.jsx / PlacesFilter.module.css   # Client component — multi-select category filter
lib/
  db.js                               # Prisma client singleton
prisma/
  schema.prisma                       # DB schema
  seed.js                             # Seed data (93 destinations, ~94 places)
public/                               # Static assets (logos, icons — NOT destination images)
jsconfig.json                         # Path alias: @/* → ./*
```

## Rules
1. When modifying, refactoring, or updating code, always update relevant comments, docstrings, and JSDoc/TSDoc to reflect the changes.
2. If a comment becomes obsolete after a change, remove it.

## Key Conventions
- **Path alias:** Use `@/` for all imports (e.g. `@/components/Header`, `@/lib/prisma`)
- **Server vs client:** Pages are server components by default. Add `'use client'` only when state/interactivity is needed (e.g. `PlacesFilter`)
- **CSS:** Always use CSS Modules + design tokens. Never inline styles or use Tailwind.
- **Design tokens:** Defined in `app/globals.css`. Always use `var(--token-name)` — do not hardcode colors or fonts.
- **Images:** Store Cloudinary URLs in the DB (`coverImageUrl` on Destination/Place). Use `next/image` with `remotePatterns` for Cloudinary. Static site assets go in `/public`.

## Design Tokens (key ones)
```css
--color-accent         /* #E8602C — terracotta, primary CTA */
--color-accent-dark    /* #C94E1F — hover state */
--color-accent-light   /* #FBF0EB — pill/tag backgrounds */
--color-ink            /* #1C2B3A — primary text */
--color-ink-secondary  /* #4A5D6E */
--color-ink-muted      /* #8A99A8 */
--color-bg             /* #FDFAF7 — page background */
--color-surface        /* #FFFFFF — card/panel background */
--color-border         /* #E8E0D8 */
--font-display         /* Playfair Display — headings */
--font-body            /* Inter — body text */
```

## Database
- **Provider:** PostgreSQL
- **ORM:** Prisma 5
- **Key models:** `Destination`, `Place`, `Category`, `PlaceCategory` (join), `Review`, `Photo`, `User`
- **Price range enum:** `FREE | BUDGET | MODERATE | EXPENSIVE`

## Common Commands
```bash
npm run dev          # Start dev server
npm run db:seed      # Seed database (npx prisma db seed also works)
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Regenerate Prisma client after schema changes
```

## Seed File Notes
- Located at `prisma/seed.js`
- 93 destinations, ~94 places
- Has deduplication logic — safe to re-run
- Update `update: { description: d.description }` to propagate description changes on re-seed
- Keep the count comment at the `// ─── Destinations (N)` header up to date when adding/removing entries
