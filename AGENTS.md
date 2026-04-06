# NN-Stack

Monorepo: pnpm workspaces · Hono backend · oRPC + TanStack Query · Tailwind V4 + Shadcn/ui · Cloudflare Workers

## Active Stack

```
FRONTEND=tanstack
DATABASE=d1
```

## Project Structure

```
apps/
  server/     Hono backend (port 4000)
  web/        Next.js frontend (port 3000)
  tanstack/   TanStack Start frontend (port 3001)
packages/
  api/        oRPC API definitions + Zod schemas
  db/         Drizzle schema + migrations
  ui/         Shadcn UI components (do not modify)
  config/     Shared TS configs
```

## Quick Commands

```bash
pnpm dev:tanstack          # server + tanstack
pnpm dev:web               # server + next.js
pnpm run lint              # lint all
pnpm run format            # format all
```

## Documentation

Read these docs based on the task at hand:

| When | Read |
|------|------|
| Adding/modifying API endpoints | [docs/api-development.md](docs/api-development.md) |
| Modifying database schema | [docs/database-d1.md](docs/database-d1.md) |
| Using UI components or styling | [docs/ui-guidelines.md](docs/ui-guidelines.md) |
| Code style, TypeScript rules | [docs/coding-standards.md](docs/coding-standards.md) |
| Env vars, deployment config | [docs/environment.md](docs/environment.md) |
| **Frontend: TanStack Start** | [docs/rules-tanstack.md](docs/rules-tanstack.md) |
| **Frontend: Next.js** | [docs/rules-next.md](docs/rules-next.md) |
| Writing or running tests | [docs/testing.md](docs/testing.md) |

**Always read the active frontend's rules file before writing frontend code.**

## Looking Up Library Documentation

Use `ctx7` CLI (installed as devDependency) to query up-to-date documentation for any library:

```bash
ctx7 library <name> "<query>"       # Find library ID
ctx7 docs <libraryId> "<query>"     # Query documentation
```
