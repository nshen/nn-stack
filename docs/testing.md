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

## E2E Tests — AI-Assisted Playwright Workflow

E2E tests follow a two-phase AI-assisted workflow using [Playwright MCP](https://github.com/microsoft/playwright-mcp).

### Prerequisites

- All interactive elements must have `data-testid` attributes (see `docs/coding-standards.md`)
- Playwright tests use `page.getByTestId()` for element selection — stable across UI refactors

### Phase 1: Write Test Specs as Natural Language

Create `.md` files describing user scenarios from the user's perspective:

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

### Phase 2: Generate Playwright Tests via Playwright MCP

1. AI reads the `.md` spec file
2. AI uses **Playwright MCP** to navigate the running app, following the spec steps:
   - Navigate to pages, click elements, fill forms, observe results
   - Discover `data-testid` attributes and page structure via Playwright's built-in selectors (`getByTestId`, `getByRole`, etc.)
3. AI generates a Playwright test file using the observed selectors:

```
e2e/specs/user-crud.md        ← Human-written scenario
e2e/tests/user-crud.spec.ts   ← AI-generated Playwright test
```

Example generated output:

```ts
test('user CRUD operations', async ({ page }) => {
  await page.goto('/playground/components/users');
  await page.getByTestId('user-name-input').fill('Test User');
  await page.getByTestId('user-email-input').fill('test@example.com');
  await page.getByTestId('create-user-btn').click();
  await expect(page.getByText('Test User')).toBeVisible();
  // ...
});
```

### File Structure

```
e2e/
├── specs/                     ← Human-written natural language scenarios
│   ├── user-crud.md
│   ├── file-upload.md
│   └── ssr-demo.md
└── tests/                     ← AI-generated Playwright tests
    ├── user-crud.spec.ts
    ├── file-upload.spec.ts
    └── ssr-demo.spec.ts
```

### Key Principles

- **Specs are the source of truth** — humans write and maintain the `.md` files
- **`data-testid` is the contract** — UI can refactor freely as long as testids stay stable
- **Generated tests run without AI** — standard Playwright in CI, no API keys needed
- **Regenerate, don't hand-edit** — when UI changes, re-run Playwright MCP observation to update tests
- Keep specs focused: one user flow per file
