# Testing

## Unit & Integration Tests — Vitest

Use [Vitest](https://vitest.dev) for unit and integration tests.

### File Conventions

- Test files: `*.test.ts` or `*.test.tsx`, co-located with the source file
- Example: `packages/api/src/users.ts` → `packages/api/src/users.test.ts`

### What to Test

- **Unit tests**: Pure functions, utilities, Zod schemas, data transformations
- **Integration tests**: oRPC handlers with mocked Cloudflare bindings, database queries with test D1 instances

### Running Tests

```bash
pnpm --filter <package> test          # Run tests for a specific package
pnpm --filter <package> test --watch  # Watch mode
```

## E2E Tests — Playwright Test Agents

E2E tests use [Playwright Test Agents](https://playwright.dev/docs/test-agents) for AI-assisted test creation, generation, and self-healing.

### Setup

Initialize Playwright Test Agents in the project:

```bash
npx playwright init-agents --loop=claude
```

This sets up agent definitions under `.github/` with all necessary MCP tools and instructions — no separate skills installation required. Regenerate after Playwright updates to access new tools.

### Workflow

#### Step 1: Planner Agent — Create Test Specs

Based on user descriptions or PRD documents, use the **Planner Agent** to explore the running app and produce markdown test plans:

- Input: user scenario description or PRD document
- Output: structured markdown spec file under `e2e/specs/`

The planner navigates the app, discovers page structure, and writes human-readable test plans with steps and expected results.

```markdown
<!-- e2e/specs/user-crud.md -->
# User CRUD

1. Navigate to /playground/components/users
2. Fill in name "Test User" and email "test@example.com"
3. Click "Create User"
4. Verify "Test User" appears in the user list
5. Click "Edit" on "Test User"
6. Change name to "Updated User", click "Update"
7. Verify "Updated User" appears in the list
8. Click "Delete" on "Updated User"
9. Verify the user is removed from the list
```

#### Step 2: Generator Agent — Create Test Files

Use the **Generator Agent** to transform markdown specs into executable Playwright test files:

- Input: markdown spec from `e2e/specs/`
- Output: Playwright test file under `e2e/tests/`
- The generator verifies selectors and assertions live against the running app using semantic selectors (`getByRole`, `getByText`, `getByLabel`, `getByPlaceholder`)

#### Step 3: Healer Agent — Run & Fix Tests

Use the **Healer Agent** to execute tests and automatically repair failures:

- Replays failing steps and inspects the current UI
- Suggests patches (locator updates, wait adjustments, data fixes)
- Re-runs until passing or guardrails activate

### File Structure

```
e2e/
├── specs/                     ← Markdown test plans (planner output)
│   ├── user-crud.md
│   ├── file-upload.md
│   └── ssr-demo.md
└── tests/                     ← Playwright test files (generator output)
    ├── seed.spec.ts           ← Bootstrap environment
    ├── user-crud.spec.ts
    ├── file-upload.spec.ts
    └── ssr-demo.spec.ts
```

### Key Principles

- **Specs are the source of truth** — review and maintain the markdown plans
- **Use semantic selectors** — prefer `getByRole`, `getByText`, `getByLabel` over fragile CSS selectors or testids
- **Generated tests run without AI** — standard Playwright in CI, no API keys needed
- **Use healer to fix flaky tests** — don't hand-edit generated tests, let the healer agent repair them
- Keep specs focused: one user flow per file
