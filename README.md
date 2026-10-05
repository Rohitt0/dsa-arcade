# DSA Arcade

**Learn DSA by Playing It.** A pixel-art adventure where each data-structure & algorithm pattern
is taught through an interactive game before you code it in C++.

> **Phase 1 (this slice):** accounts + a responsive pixel **World Map** you can explore down to the
> pattern "learn" screen. The games, the C++ editor, hints, challenges, and progress tracking arrive
> in later phases. The architecture is already laid out to drop them in.

---

## Tech stack

- **Monorepo** — npm workspaces: `@dsa/shared`, `@dsa/api`, `@dsa/web`
- **API** — Express 4 + TypeScript (tsx), Prisma ORM, PostgreSQL 16, JWT access token + httpOnly
  refresh cookie, Zod validation, Pino logging
- **Web** — React 18 + Vite 5, React Router 6, TanStack Query v5, Zustand v5, Tailwind + custom
  pixel UI (mobile-first, responsive from 320px up)
- **Shared** — domain types + Zod schemas used by both sides

## Prerequisites

- **Node.js 20+** and npm
- **Docker Desktop** (for PostgreSQL) — must be **running** before the DB steps below

## Setup

From the repo root:

```bash
npm install
```

Start the database (Docker Desktop must be open):

```bash
npm run db:up
```

Generate the Prisma client, run migrations, and seed the world (8 regions, 5 patterns):

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

> Shortcut: `npm run setup` runs install → db:up → generate → migrate → seed in one go.

## Run

```bash
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:4000 (health check at `/api/health`)

The web dev server proxies `/api` to the API, so everything is same-origin (no CORS, refresh cookie
stays first-party).

## Try it

1. Open http://localhost:5173 → **Start playing** → create an account.
2. You land on the **World Map**. The first region is **Open**; the rest are **Locked** (progression
   lands in a later phase).
3. Open the first region → pick a pattern → read its idea, analogy, complexity, and pseudocode.
4. Resize the window (or use device emulation) to 375 / 768 / 1280 — the nav switches between a
   bottom bar (mobile) and a sidebar (tablet/desktop).

## Useful scripts (root)

| Script | What it does |
| --- | --- |
| `npm run dev` | Run API + web together |
| `npm run dev:api` / `npm run dev:web` | Run one side |
| `npm run db:up` | Start Postgres in Docker |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed regions + patterns |
| `npm run db:reset` *(in `@dsa/api`)* | Drop + recreate + reseed the DB |

## Project structure

```
packages/
  shared/   # @dsa/shared — types + zod schemas (imported from source, no build step)
  api/      # @dsa/api    — Express + Prisma; routes -> controllers -> services
  web/      # @dsa/web    — React + Vite pixel client
```

## Configuration

API env lives in `packages/api/.env` (copied from `.env.example`). The defaults match
`docker-compose.yml` and work out of the box for local dev. **Change the JWT secrets before
deploying anywhere real.**

## What's next

Binary Search / Two Pointers / Stack / BFS stages, the Phaser game bridge, the Monaco C++ editor, a
**sandboxed** C++ runner service, the progressive hint system, pattern-recognition bosses, and
rule-based mastery + progress tracking.
