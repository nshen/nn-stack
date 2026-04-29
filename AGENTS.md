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
  tanstack/   TanStack Start frontend (port 3000)
packages/
  api/        oRPC API definitions + Zod schemas
  db/         Drizzle schema + migrations
  ui/         Shadcn UI components (do not modify)
  config/     Shared TS configs
```

## Quick Commands

```bash
pnpm dev                   # server + tanstack
pnpm typecheck             # tsc --noEmit across all workspaces
pnpm test                  # vitest (server integration tests)
pnpm test:e2e              # playwright E2E (auto-starts dev server)
pnpm lint                  # biome lint
pnpm format                # biome format --write
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
| Writing or running tests | [docs/testing.md](docs/testing.md) |
| Debugging UI issues | [docs/debugging.md](docs/debugging.md) |

**Always read the frontend rules file before writing frontend code.**

## Looking Up Library Documentation

Use `pnpm ctx7` CLI (installed as devDependency) to query up-to-date documentation for any library:

```bash
pnpm ctx7 library <name> "<query>"       # Find library ID
pnpm ctx7 docs <libraryId> "<query>"     # Query documentation
```
