# DSA Arcade

**Learn DSA by Playing It.** A pixel-art adventure where each algorithm pattern is taught through
an interactive game before students solve it in C++.

## Current slice

- Responsive account, world map, region, and pattern pages
- Six-stage Phaser Sliding Window game: find, move, track, variable window, hidden pattern, and boss
- First C++ challenge: **Longest Substring Without Repeating Characters**
- Monaco C++20 editor and a separate Docker-based execution service

Hints, saved game progress, mastery updates, and coding bosses are later milestones.

## Stack

- **Monorepo:** npm workspaces for `@dsa/shared`, `@dsa/api`, `@dsa/web`, and `@dsa/runner`
- **API:** Express 4, TypeScript, Prisma, PostgreSQL 16, JWT, Zod
- **Web:** React 18, TypeScript, Vite 5, React Router, TanStack Query, Monaco, Phaser 4, Tailwind
- **Execution:** A separate C++ runner container with per-process isolation and resource limits

## Prerequisites

- Node.js 20+ and npm
- Docker Desktop running for PostgreSQL and the C++ runner

## Setup

From the repository root:

```bash
npm install
npm run db:up
npm run db:generate
npm run db:migrate
npm run db:seed
npm run runner:up
```

Then start the web app and API:

```bash
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:4000 (`/api/health`)
- Local runner: `127.0.0.1:4010`

`npm run runner:up` builds and starts the C++ execution service and its restricted gateway. The API
sends code to the gateway; it never compiles or executes student code inside Express. Neither
service mounts the Docker socket. The compiler runner is on a private, internal network with a
read-only root filesystem, dropped capabilities, and container-level CPU, memory, and process
limits. The gateway is the only service with a host port; it accepts only authenticated health and
execution requests and forwards them to the private runner. Each compile/run uses an unprivileged
UID, a private temporary working directory, a minimal environment, process resource limits, output
caps, and a timeout. The service is limited to one active submission. This is a practical local MVP
sandbox; production should use a stronger per-submission isolation boundary such as a dedicated
execution VM or hardened sandbox runtime.

The development runner token in `docker-compose.yml` and `packages/api/src/config/env.ts` is not
for deployment. Set a strong `RUNNER_TOKEN` in both the API environment and Compose environment
before deploying. Production should keep the runner on a private network.

## Try it

1. Open the app, create an account, and enter the world.
2. Open **Sliding Window** and play the Train Window lesson.
3. Open the C++ challenge below the game. Run the visible and hidden tests from the editor.
4. Check the layout at phone, tablet, and desktop widths; game controls and editor actions are
   available without hover.

## Useful scripts

| Script                | What it does                                           |
| --------------------- | ------------------------------------------------------ |
| `npm run dev`         | Run API and web client                                 |
| `npm run typecheck`   | Typecheck shared, API, and web workspaces              |
| `npm run build`       | Build shared and web workspaces                        |
| `npm run db:up`       | Start PostgreSQL                                       |
| `npm run db:generate` | Generate Prisma client                                 |
| `npm run db:migrate`  | Apply migrations                                       |
| `npm run db:seed`     | Seed regions, patterns, and the first coding challenge |
| `npm run runner:up`   | Build and start isolated C++ execution                 |

## Structure

```text
packages/
  shared/   domain types and validation schemas
  api/      Express routes, services, Prisma schema/migrations and seed data
  web/      React pages, pixel UI, Monaco editor and Phaser game engine
  runner/   isolated C++ execution gateway and sandbox image
```

The API environment file is `packages/api/.env`; start from `.env.example`. The Prisma schema has
a new challenge/submission migration. Apply migrations and reseed after updating the repository.
