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

E2E tests follow a two-phase AI-assisted workflow:

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

### Phase 2: Generate Playwright Tests

1. Run the spec through **Chrome DevTools MCP** to observe the actual page structure (selectors, DOM hierarchy, element states)
2. Based on the observed structure, generate a Playwright test file:

```
e2e/specs/user-crud.md        ← Human-written scenario
e2e/tests/user-crud.spec.ts   ← AI-generated Playwright test
```

### Key Principles

- **Specs are the source of truth** — humans write and maintain the `.md` files
- **Generated tests are reproducible** — re-run the MCP observation + generation when UI changes
- **Don't hand-edit generated tests** — regenerate them from specs instead
- Keep specs focused: one user flow per file
