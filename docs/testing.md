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

## Playwright Test Agents

AI-assisted E2E test creation via [Playwright Test Agents](https://playwright.dev/docs/test-agents). Agent definitions are in `.claude/agents/playwright-test-*.md`, backed by the `playwright-test` MCP server.

### Agents

1. **Planner** — explore the running app, produce markdown test specs under `apps/tanstack/e2e/specs/`
2. **Generator** — transform specs into Playwright test files under `apps/tanstack/e2e/`
3. **Healer** — run failing tests, inspect UI, auto-repair locators and assertions

### Seed file

`apps/tanstack/e2e/seed.spec.ts` — bootstraps the test environment. Referenced by generated tests.

### Key principles

- Specs are the source of truth — review and maintain the markdown plans
- Use semantic selectors — prefer `getByRole`, `getByText`, `getByLabel` over fragile CSS selectors
- Generated tests run without AI — standard Playwright in CI, no API keys needed
- Use healer to fix flaky tests instead of hand-editing
- Keep specs focused: one user flow per file
