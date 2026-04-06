# Coding Standards

## General

- All code comments in English. Don't write meaningless comments, don't easily delete existing comments.
- All UI text in English.
- File names: lowercase with `-` separators (no `_`). Example: `user-profile.tsx`.
- Complex JSX structures MUST have English comments to separate sections (e.g., `{/* Header Section */}`).
- Use TanStack Query V5 for backend interaction. Avoid React Context API.
- Don't over-optimize: no meaningless `useMemo` / `useCallback`, especially on TanStack Query hook results.
- Prefer grid or the most concise layout implementation.

## TypeScript

- **No `any` type**. Use `unknown` with type narrowing, or define explicit interfaces/types. Do not use `as any`.
- **Error handling**: In `try-catch`, the catch variable is `unknown` by default. Do not cast to `any`.

```typescript
try {
  // ...
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error("An unknown error occurred");
  }
}
```

## Test Attributes

All interactive elements must have `data-testid` for E2E testing. Non-interactive display elements do not need it.

**What needs `data-testid`**: buttons, inputs, links, form controls, list containers, dialog triggers, dropdowns.

**Naming convention**: `<context>-<element>`, lowercase with `-`:

```tsx
<Button data-testid="create-user-btn">Create</Button>
<Input data-testid="user-name-input" />
<ul data-testid="user-list">
  <li data-testid={`user-item-${user.id}`}>...</li>
</ul>
<Dialog>
  <DialogTrigger data-testid="edit-user-dialog-trigger" />
  <DialogContent data-testid="edit-user-dialog">...</DialogContent>
</Dialog>
```

## Code Quality

- Linting and formatting: Biome.
- Run `pnpm run lint` after each modification.

## Monorepo Conventions

- **`@nn-stack/api`**: Shared API contracts (oRPC + Zod).
- **`@nn-stack/db`**: Database schema definitions.
- **`@nn-stack/ui`**: Shared Shadcn UI components (never modify directly).
- **`@nn-stack/config`**: Shared TypeScript configs.
