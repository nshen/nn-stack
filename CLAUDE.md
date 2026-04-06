# Active Frontend

FRONTEND=tanstack

This project has two frontend apps with identical features. Only modify the active one above:

- `web` → `apps/web/` (Next.js) — uses App Router, `'use client'` directives, `next/link`, `next/image`
- `tanstack` → `apps/tanstack/` (TanStack Start) — uses file-based routing, TanStack Router `<Link>`, route loaders for SSR

When adding features, create pages/components in the active frontend's directory.
For shared logic (API definitions, DB schema, UI components), use the `packages/` directory as usual.

See GEMINI.md for full development conventions.
