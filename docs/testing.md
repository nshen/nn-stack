# Testing Strategy

## Per-Workspace Overview

| Workspace | Tool | Type | Notes |
|-----------|------|------|-------|
| `apps/server` | Vitest + `@cloudflare/vitest-pool-workers` | Integration | Real D1/KV via miniflare, `import app` + `app.fetch()` |
| `apps/tanstack` | Playwright | E2E | Against running dev server |
| `packages/api` | None | — | Covered by `apps/server` tests (see below) |
| `packages/db` | None | — | Schema-only, no runtime logic |
| `packages/ui` | None | — | Shadcn components, covered by E2E |
| `packages/config` | None | — | tsconfig only |

## Why `packages/api` has no standalone tests

All API handlers depend on Cloudflare bindings (D1, KV, R2) via `context.ts`. Mocking these is fragile. Instead, `apps/server` tests run handlers in real miniflare Workers runtime through the full request chain: HTTP → Hono → oRPC → handler → D1.

## Commands

```bash
pnpm test              # all integration tests
pnpm test:e2e          # Playwright E2E (needs dev server)
```

## Server tests

- Config: `apps/server/vitest.config.ts` — `cloudflareTest()` plugin with miniflare D1/KV bindings
- Setup: `apps/server/tests/setup.ts` — runs D1 migrations from `packages/db/migrations/`
- Pattern: `import app from '../src/index'` then `app.fetch(new Request(...))`
- Location: `apps/server/tests/*.test.ts`

## Web E2E tests

- Config: `apps/tanstack/playwright.config.ts` — Chromium, baseURL `localhost:3000`, auto-starts dev server
- Location: `apps/tanstack/e2e/*.spec.ts`
- Use semantic selectors — prefer `getByRole`, `getByText`, `getByLabel` over fragile CSS selectors

## Future: Playwright Test Agents

> Not yet initialized. Run `npx playwright init-agents --loop=claude` to set up.

Once initialized, use AI-assisted agents for test creation and self-healing:

1. **Planner Agent** — explore the running app, produce markdown test specs under `apps/tanstack/e2e/specs/`
2. **Generator Agent** — transform specs into Playwright test files under `apps/tanstack/e2e/tests/`
3. **Healer Agent** — run failing tests, inspect UI, auto-repair locators and assertions

Key principles:
- Specs are the source of truth
- Generated tests run without AI in CI
- Use healer to fix flaky tests instead of hand-editing
- Keep specs focused: one user flow per file
