# Project engineering guide

Keep changes maintainable and consistent with the surrounding code. Use npm as the package manager.

## Product context

**Company:** SockLock sells magnetic socks that don't get lost in the washing machine (a magnet on the cuffs holds the pair together). Subscription: 5 pairs for $29, then a new delivery every quarter. Main market is the US, with English video ads on Meta.

**Problem:** motion designers spend about half of each ad modification (~1.5 of 3 hours) manually rewriting the text of a winning script: hooks, opening lines and on-screen text. The team makes ~240 modifications a month, and the goal needs ~500.

**What we build:** a web app. A designer pastes a winning script and within a minute gets 10–30 variants of hooks, opening lines and on-screen text. Each variant is tagged with its angle and goes through automatic checks. The designer picks the ones they want and exports a brief or a CSV.

**MVP goal:** cut the text part of a modification from ~1.5 h to ~0.5 h, and collect data for a 2-week pilot (time spent, chosen variants).

## Stack

- Next.js App Router with React Server and Client Components (Server by default, add `"use client"` only when needed)
- TypeScript in strict mode
- Tailwind CSS
- zod for validating data at boundaries

## Repository layout

- `app` - Next.js App Router: `page.tsx` (main page, assembles components) and `api/` route handlers (`generate`, `health`).
- `components` - UI components.
- `lib` - shared logic: types, zod schemas, prompts, Claude client (server only), parsing, checks, export, logging, cost.
- `tests` - vitest unit tests for `lib`.
- `public` - static assets; `public/sample-data` holds demo scripts, brand guide and tested hooks CSV.
- `docs` - conventions and feature documentation.
- `docs/features` - one file per feature, describing how it works.

## Conventions

- TypeScript: `docs/typescript-conventions.md`
- React & Next.js: `docs/react-&-next-conventions.md`
- Tailwind: `docs/tailwind-conventions.md`
- Web: `docs/web-conventions.md`
- Testing: `docs/testing-conventions.md`

## Delivery

Reference `docs/delivery-conventions.md` for conventions on delivering finished features and ask to `prepare to commit`.
