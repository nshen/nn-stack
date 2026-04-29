# Testing Guide

How testing is set up in this scaffold, and how to add tests for new code in your fork.

## Mental model

There are **two test types** with very different costs and guarantees:

| Type | Tool | Where it runs | What it covers | When to use |
|---|---|---|---|---|
| **Integration** | Vitest + `@cloudflare/vitest-pool-workers` | Real miniflare Worker runtime, in-process | Hono routes · oRPC procedures · D1 / KV / R2 bindings · full request chain | Backend logic — anything the server does |
| **E2E** | Playwright (Chromium) | Real browser hitting a deployed URL (CI) or local dev server | User-visible flows: page loads, clicks, form submits, navigation | Frontend behavior worth a real browser |

**No unit tests, no mocks**. Mocking Cloudflare bindings is fragile (mock divergence is a known foot-gun); we always test against the real runtime via miniflare.

## Workspace layout

| Workspace | Tests? | Why |
|---|---|---|
| `apps/server` | ✅ Vitest integration | Runs the Hono app in miniflare with real D1/KV |
| `apps/tanstack` | ✅ Playwright E2E | Browser-driven tests against built app |
| `packages/api` | ❌ | All handlers need Cloudflare bindings — covered transitively by `apps/server` tests |
| `packages/db` | ❌ | Schema only, no runtime logic |
| `packages/ui` | ❌ | Vendored shadcn — covered transitively by E2E |
| `packages/config` | ❌ | tsconfig only |

This means: **add backend tests in `apps/server/tests/`, frontend tests in `apps/tanstack/e2e/`**. You won't normally touch other workspaces' test config.

## Commands

```bash
pnpm test              # vitest run (server integration)
pnpm test:e2e          # playwright test (auto-starts dev server locally)
pnpm typecheck         # tsc --noEmit across all workspaces
pnpm exec biome ci     # lint + format + import-sort, read-only (what CI runs)
```

CI runs all of the above on every PR; deploys are blocked until they pass.

---

## Writing server integration tests

### Anatomy of a test

The pattern is **import the app, call `app.fetch()`**:

```ts
// apps/server/tests/server.test.ts
import { describe, expect, it } from 'vitest';
import app from '../src/index';

it('GET / returns hello message', async () => {
  const res = await app.fetch(new Request('http://localhost/'));
  expect(res.status).toBe(200);
  expect(await res.text()).toBe('Hello nn stack server!');
});
```

`http://localhost/...` is a placeholder URL — `new Request()` requires an absolute URL but Hono only routes on the path. No real HTTP server is started.

### Testing oRPC endpoints

Use the `rpc()` helper at the top of `server.test.ts`:

```ts
async function rpc(path: string, input?: unknown) {
  const urlPath = path.replace(/\./g, '/');  // 'todos.createTodo' → 'todos/createTodo'
  const resp = await app.fetch(
    new Request(`http://localhost/rpc/${urlPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ json: input }),  // oRPC wire format
    }),
  );
  const raw = (await resp.json()) as { json?: unknown };
  return { status: resp.status, body: raw.json };
}

it('creates a todo', async () => {
  const { status, body } = await rpc('todos.createTodo', { text: 'hi' });
  expect(status).toBe(200);
  expect((body as { text: string }).text).toBe('hi');
});
```

**Why the wrapping**: oRPC sends inputs as `{ json: input }` and outputs as `{ json: output }` to support SuperJSON / binary encodings transparently. The helper hides this.

### How D1 / KV are available

`apps/server/vitest.config.ts` declares miniflare bindings:

```ts
miniflare: {
  bindings: { CORS_ORIGIN: 'http://localhost:3000', TEST_MIGRATIONS: migrations },
  d1Databases: { DB: { id: 'test-db' } },
  kvNamespaces:  { KV: { id: 'test-kv' } },
}
```

`tests/setup.ts` runs once before each test file, applying D1 migrations:

```ts
import { applyD1Migrations } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
```

`TEST_MIGRATIONS` is the `.sql` files from `packages/db/migrations/`, loaded into a binding by `vitest.config.ts` (because the Worker sandbox has no Node `fs`).

### Database state between tests

D1 lives in miniflare's in-memory SQLite. **State persists across tests within a single run**, so if you depend on isolation, either:

- Generate unique data per test (e.g. random IDs, timestamps)
- Reset the table inside the test
- Use vitest's `beforeEach` for cleanup

The current todos test does the random-data approach implicitly — no cleanup needed.

### Adding a test for a new endpoint

1. Add the procedure in `packages/api/src/<area>.ts` and wire it into `appRouter`
2. Add a test in `apps/server/tests/server.test.ts` (or a new `<area>.test.ts`):
   ```ts
   it('POST /rpc/<area>/<procedure> ...', async () => {
     const { status, body } = await rpc('<area>.<procedure>', { ...input });
     expect(status).toBe(200);
     expect(body).toEqual(/* expected */);
   });
   ```
3. `pnpm test` to verify

### Common pitfalls

- **Forgot `import app from '../src/index'`** — needed once per file
- **Used `GET` for an oRPC procedure** — oRPC always uses POST. Test name should say POST.
- **Tried to read a file with Node `fs`** — won't work inside the Worker sandbox; pass data via miniflare bindings instead (see `TEST_MIGRATIONS`)
- **Asserted on a `{ json: ... }` wrapper** — use the `rpc()` helper or unwrap manually

---

## Writing E2E tests

### Anatomy of a smoke test

```ts
// apps/tanstack/e2e/smoke.spec.ts
import { expect, test } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/tanstack/i);
  });
});
```

### Local vs CI mode

`apps/tanstack/playwright.config.ts` has two behaviors driven by `PLAYWRIGHT_BASE_URL`:

```
PLAYWRIGHT_BASE_URL unset (local) → playwright auto-starts `pnpm run dev`,
                                     hits http://localhost:3000

PLAYWRIGHT_BASE_URL set (CI)     → playwright skips webServer, hits the
                                     deployed stage URL
                                     (https://dev.nn.nshen.net for dev,
                                      https://nn.nshen.net for prod)
```

So locally just run `pnpm test:e2e` — the dev server is bootstrapped automatically. In CI the deploy job runs first and passes its URL to the e2e job.

### Selector best practices

Prefer **semantic role-based locators**:

```ts
// Good — survives DOM refactors
await page.getByRole('button', { name: 'Create todo' }).click();
await page.getByLabel('Email').fill('a@b.com');
await page.getByText('Welcome back').click();

// Fragile — breaks on every CSS tweak
await page.locator('.btn-primary').click();
await page.locator('#email-input').fill('a@b.com');
```

When the DOM lacks accessible labels, add `data-testid` attributes — they're explicit anchors not coupled to styling:

```tsx
<button data-testid="create-todo">Create</button>
```

```ts
await page.getByTestId('create-todo').click();
```

### Interacting with oRPC-backed UI

E2E tests run against the **deployed** app, so all RPC calls go to the real backend. This means:

- Tests should use throwaway data (random titles, unique emails)
- Don't assume initial state — assert on what the test created
- D1 in dev/prod stage persists; tests that mutate need to clean up or accept residue

### Adding a new E2E test

1. Create `apps/tanstack/e2e/<feature>.spec.ts`
2. Use `test.describe('<feature>', () => { ... })` to group
3. Locally: `pnpm test:e2e` (or `pnpm exec playwright test e2e/<feature>.spec.ts` from `apps/tanstack/`)
4. Inspect failures via the auto-saved `apps/tanstack/playwright-report/` (also uploaded as a CI artifact on failure)

### Running a single test

```bash
cd apps/tanstack
pnpm exec playwright test e2e/smoke.spec.ts
pnpm exec playwright test --grep "homepage loads"
pnpm exec playwright test --headed   # see the browser
pnpm exec playwright test --debug    # step through
```

---

## CI pipeline

```
PR (any branch)         →  test                                  (lint/typecheck/unit)
push dev                →  test  →  deploy(dev)  →  e2e          (against dev.nn.nshen.net)
push main               →  test  →  deploy(prod) →  e2e          (against nn.nshen.net)
```

- A failing `test` job blocks deploy
- E2E runs **after** deploy (Alchemy convention: tests target the deployed stage, not local emulation)
- A failing E2E does NOT roll back — dev/prod stage tolerates the failed deploy and the next push fixes it

The full workflow is `.github/workflows/deploy.yml`.

---

## Writing tests with natural language (Playwright Test Agents)

Three Claude sub-agents in `.claude/agents/` drive a real browser via the `playwright-test` MCP server (declared in `.mcp.json`). You describe what you want in plain language; they explore the app, write the spec, generate the code, and repair drift.

| Agent | What it does | What you give it | What you get |
|---|---|---|---|
| `playwright-test-planner` | Open the running app, click around, capture flows | A goal like "test the todo creation flow" | Markdown plan in `apps/tanstack/e2e/specs/<feature>.md` |
| `playwright-test-generator` | Replay each plan step in a browser, learn real selectors, emit code | Path to a spec markdown file | `.spec.ts` in `apps/tanstack/e2e/<feature>.spec.ts` |
| `playwright-test-healer` | Run failing tests, snapshot DOM, fix selectors/assertions | "tests are failing, fix them" | Edited `.spec.ts` files |

These run **only when you ask Claude Code** (or another agent harness) — generated tests run as plain Playwright in CI, no AI in the hot path.

### Prerequisites

1. **Local dev server up**: `pnpm dev` (planner/generator drive a live browser at `http://localhost:3000`)
2. **MCP server**: `.mcp.json` already declares `playwright-test`. Approve it in Claude Code on first use.
3. **Seed file**: `apps/tanstack/e2e/seed.spec.ts` exists — agents reference it for shared setup. Edit it if your tests need login or seeded data.

### Step 1 — Plan: "test feature X"

In Claude Code, ask in natural language. Examples:

> "用 playwright-test-planner 探索 /playground/components/users，规划一份完整的测试计划。涵盖列表加载、添加用户、表单校验、错误状态。"

> "Use the planner agent to map the todo creation flow at /playground. Cover happy path, empty input validation, and the optimistic-update revert when the API errors."

The planner will:

1. Open the page in a browser
2. Inspect the DOM (via `browser_snapshot` — no screenshots, just accessibility tree)
3. Click through the flows to verify they work
4. Save a markdown plan to `apps/tanstack/e2e/specs/<feature>.md`

The plan is **human-readable**, structured as `### Scenario` blocks with numbered steps. Review and edit it — this is your source of truth, not the generated code.

### Step 2 — Generate: "turn this plan into tests"

Once you're happy with the plan:

> "用 playwright-test-generator 把 specs/users.md 里的所有 scenario 生成测试文件。"

> "Generate Playwright tests for each scenario in specs/todo-creation.md."

The generator will:

1. Read each scenario from the plan
2. Set up the browser with `generator_setup_page`
3. **Manually execute each step** in a real browser (via Playwright MCP tools)
4. Record the actual selectors and timings used
5. Write a `.spec.ts` file with one `test()` per scenario, with each step preserved as a comment

Output looks like:

```ts
// spec: specs/todo-creation.md
// seed: e2e/seed.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Adding New Todos', () => {
  test('Add Valid Todo', async ({ page }) => {
    // 1. Click in the input and type "Buy milk"
    await page.getByRole('textbox', { name: /what needs/i }).fill('Buy milk');
    // 2. Press Enter
    await page.keyboard.press('Enter');
    // 3. The todo appears in the list
    await expect(page.getByText('Buy milk')).toBeVisible();
  });
});
```

Selectors come from real browser exploration → robust by default (role-based, accessible-name-based).

### Step 3 — Heal: "fix the failing tests"

After UI changes, when `pnpm test:e2e` reports failures:

> "playwright-test-healer 跑一下所有测试，把失败的修好。"

> "Run the test healer — fix any selector drift in the e2e suite."

The healer will:

1. `test_run` to identify failures
2. `test_debug` to pause at the failure and inspect DOM
3. Compare current snapshot to expected step
4. Edit the `.spec.ts` to use updated locators or assertions
5. Re-run until green
6. As last resort, mark the test `test.fixme()` with a comment explaining the regression — never silently delete a check

This replaces the "spend 20 minutes hunting for the right CSS selector" loop.

### When to use this vs hand-write

| Use natural-language agents when... | Hand-write when... |
|---|---|
| Testing a brand-new feature with multiple flows | A single smoke check (< 20 lines) |
| Onboarding tests for an existing area | You need fine control over timing / network mocking |
| Generating regression coverage after a redesign | The test is critical infra (auth, billing) — you want full ownership |
| Tests keep breaking from CSS changes | Performance / specific browser-API tests |

### Tips

- **One feature per spec** — keep `specs/*.md` focused; easier to plan, easier to regenerate
- **Edit the spec, not the test** — when requirements change, update the markdown and re-run the generator
- **Commit the seed file** — `e2e/seed.spec.ts` is intentionally committed; agents read it on every run
- **Don't approve random MCP servers** — only `playwright-test` (in `.mcp.json`) and any you've explicitly added. Treat unapproved servers as untrusted.

---

## Quick reference

```bash
# Add a backend test → apps/server/tests/<name>.test.ts, then:
pnpm test

# Add a frontend test → apps/tanstack/e2e/<name>.spec.ts, then:
pnpm test:e2e

# See type errors → pnpm typecheck
# See lint/format issues → pnpm exec biome ci
# Format your changes → pnpm format    (biome check --write .)
```

For the runtime details of `cloudflare:test` and `applyD1Migrations`, see [Cloudflare's vitest pool docs](https://developers.cloudflare.com/workers/testing/vitest-integration/get-started/).
