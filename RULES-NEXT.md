# Next.js Frontend Rules

This file contains rules specific to `apps/web/` (Next.js). Read `GEMINI.md` first for shared project conventions.

## Framework Basics

- **Client components must have `'use client'`** at the top of the file
- **Import alias**: Use `@/` for absolute imports (e.g., `import { orpc } from '@/lib/orpc'`)
- **Env vars**: Access via `process.env.NEXT_PUBLIC_SERVER_URL`

## Routing

Next.js uses App Router with file-based routing in `app/`.

| Concept | Pattern |
|---------|---------|
| Page | `app/foo/page.tsx` → `/foo` |
| Layout | `app/foo/layout.tsx` wraps all pages under `/foo` |
| API route | `app/api/foo/route.ts` |

### Page Definition

```tsx
export default function MyPage() {
  return <div>...</div>;
}
```

### Layout

Layouts receive `{children}`:

```tsx
export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav>...</nav>
      {children}
    </div>
  );
}
```

### Navigation

Use Next.js `<Link>` with `href` prop for internal links:

```tsx
import Link from 'next/link';

// Internal link
<Link href="/playground/components/users">Users</Link>

// External link
<Link href="https://example.com" target="_blank">Docs</Link>
```

### Get Current Path

```tsx
'use client';
import { usePathname } from 'next/navigation';

const pathname = usePathname();
const isIndex = pathname === '/playground';
```

## SSR / Data Fetching

Use async Server Components with React Query dehydration:

```tsx
import { getQueryClient } from '@/lib/query-client';
import { orpc } from '@/lib/orpc';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export const dynamic = 'force-dynamic';

export default async function MyPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(orpc.myApi.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MyClientComponent />
    </HydrationBoundary>
  );
}
```

## File Structure

```
apps/web/
├── app/                  # Pages & layouts
│   ├── layout.tsx        # Root layout (HTML shell, providers)
│   ├── page.tsx          # Home page (/)
│   └── playground/       # Nested routes
├── components/           # Reusable components
├── lib/                  # Utilities (orpc, query-client, upload)
└── next.config.ts
```

## Output Requirements

- Save components in `apps/web/components/`
- Save pages in `apps/web/app/`
  - Example: `Login` component → `apps/web/components/login/index.tsx`
  - Example: `Login` page → `apps/web/app/playground/components/login/page.tsx`

## Images

Use `next/image` for optimized images:

```tsx
import Image from 'next/image';

<Image src={url} alt="description" fill className="object-cover" />
```
