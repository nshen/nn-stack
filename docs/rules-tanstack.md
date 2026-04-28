# TanStack Start Frontend Rules

This file contains rules specific to `apps/tanstack/` (TanStack Start). Read `GEMINI.md` first for shared project conventions.

## Framework Basics

- **No `'use client'` directives** — TanStack Start does not use React Server Components
- **Import alias**: Use `~/` for absolute imports (e.g., `import { orpc } from '~/lib/orpc'`)
- **Env vars**: Access via `import.meta.env.NEXT_PUBLIC_SERVER_URL` (not `process.env`)

## Routing

TanStack Start uses file-based routing via TanStack Router in `src/routes/`.

| Concept | Pattern |
|---------|---------|
| Page route | `src/routes/foo.tsx` → `/foo` |
| Index route | `src/routes/foo/index.tsx` → `/foo` |
| Layout route | `src/routes/foo.tsx` with `<Outlet />` + children in `src/routes/foo/` |
| Root layout | `src/routes/__root.tsx` |

### Route Definition

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/my-page')({
  component: MyPage,
});

function MyPage() {
  return <div>...</div>;
}
```

### Layout Routes

Layout routes render `<Outlet />` (not `{children}`):

```tsx
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/playground')({
  component: PlaygroundLayout,
});

function PlaygroundLayout() {
  return (
    <div>
      <nav>...</nav>
      <Outlet />
    </div>
  );
}
```

### Navigation

Use TanStack Router's `<Link>` with `to` prop for internal links, `<a>` for external:

```tsx
import { Link } from '@tanstack/react-router';

// Internal link
<Link to="/playground/components/users">Users</Link>

// External link
<a href="https://example.com" target="_blank" rel="noopener noreferrer">Docs</a>
```

### Get Current Path

```tsx
import { useLocation } from '@tanstack/react-router';

const location = useLocation();
const isIndex = location.pathname === '/playground';
```

## SSR / Data Fetching

Use route `loader` for server-side data prefetching. The QueryClient is available in the route context:

```tsx
export const Route = createFileRoute('/my-page')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(orpc.myApi.queryOptions());
  },
  component: MyPage,
});
```

No `HydrationBoundary` or `dehydrate()` needed — TanStack Start handles this automatically.

## File Structure

```
apps/tanstack/
├── src/
│   ├── routes/           # Pages & layouts
│   │   ├── __root.tsx    # Root layout (HTML shell, providers)
│   │   ├── index.tsx     # Home page (/)
│   │   └── playground/   # Nested routes
│   ├── components/       # Reusable components
│   ├── lib/              # Utilities (orpc, query-client, upload)
│   └── styles/           # CSS files
├── vite.config.ts
├── alchemy.run.ts
└── package.json
```

## Output Requirements

- Save components in `apps/tanstack/src/components/`
- Save page routes in `apps/tanstack/src/routes/`
  - Example: `Login` component → `apps/tanstack/src/components/login/index.tsx`
  - Example: `Login` page → `apps/tanstack/src/routes/playground/components/login.tsx`

## Images

Use plain `<img>` tags:

```tsx
<img src={url} alt="description" className="h-full w-full object-cover" />
```
