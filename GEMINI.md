# NN-Stack Project Overview

This project is a monorepo managed by `pnpm` and structured into `apps` and `packages`.

## Project Structure

```
nn-stack/
├── apps/
│   ├── server/     # Backend Hono server
│   └── web/        # Frontend Next.js application
└── packages/
    ├── api/        # Shared API interfaces (orpc)
    ├── db/         # Drizzle database
    ├── config/     # Common configurations
    └── ui/         # Shadcn UI components
```

- **`apps/server`**: A backend application uses `hono` and `@orpc/server`. Automatically handle APIs defined in `packages/api`. Deployment is handled via `alchemy.run`.
- **`apps/web`**: A frontend web application built with Next.js. It interacts with the backend services. Deployment is handled via `alchemy.run`.
- **`packages/api`**: A shared package defining the API interfaces and types. Uses `orpc` to implement end-to-end type-safe APIs, validate by using zod, shared between web and server.
- **`packages/config`**: A shared package for common configurations.
- **`packages/ui`**: Original `shadcn` UI components will be installed here for use by other packages. These components should not be modified.
- **`packages/db`**: Code related to Drizzle Cloudflare D1 database, including schema definitions for database tables.��

## Tech Stack

| Category        | Technology           |
| --------------- | -------------------- |
| Package Manager | pnpm                 |
| Frontend        | Next.js, React Query |
| Backend         | Hono                 |
| API Layer       | ORPC, Zod            |
| UI Library      | Shadcn/ui, Radix UI  |
| Styling         | Tailwind CSS         |
| Code Quality    | Biome                |
| Deployment      | Alchemy              |

## Building and Running

This project uses `pnpm` for package management.

### Installation

To install all dependencies across the monorepo:

```bash
pnpm install
```

### Development

To start the development servers for all applications:

```bash
pnpm run dev
```

### Linting and Formatting

This project uses Biome for linting and formatting.

- To lint the entire project and write fixes:
  ```bash
  pnpm run lint
  ```
- To format the entire project and write fixes:
  ```bash
  pnpm run format
  ```

### Deployment

This project uses `alchemy` for deployment.

- Deploy to development environment:
  ```bash
  pnpm run deploy:dev
  ```
- Deploy to production environment:
  ```bash
  pnpm run deploy:prod
  ```
- General deploy (may require additional configuration):
  ```bash
  pnpm run deploy
  ```

### Destroy Deployment

- Destroy development environment deployment:
  ```bash
  pnpm run destroy:dev
  ```
- Destroy production environment deployment:
  ```bash
  pnpm run destroy:prod
  ```
- General destroy (may require additional configuration):
  ```bash
  pnpm run destroy
  ```

## Development Conventions

- **Monorepo Management**: pnpm workspaces are used to manage multiple packages within a single repository.
- **Code Style**: Enforced by Biome (linting and formatting).
- **API Definition**: The `@nn-stack/api` package defines the shared API contracts.
- **Database Schema Definition**: The `@nn-stack/db/src/schema.ts` file is used to define the d1 database table structure.
- **UI Components**: Reusable UI components are developed in the `@nn-stack/ui` package.

## Web Development Rules

Must comply with Next.js best practices

## Constraints

- If the component is a client component, don't forget to add 'use client'
- If the page needs UI components, don't use native browser components. Must develop based on Shadcn UI components, imported from `@nn-stack/ui`. Restore the design to the maximum extent possible. If there are issues, you can use Shadcn's MCP tool.
- Only use tailwindcss V4 for styling. CSS inline styles are not allowed. Follow tailwindcss v4 built-in responsive design rules and mobile-first principles.
- If there are multiple ways to implement layout, prefer using grid or the most concise implementation method
- When components need icons, only use icons provided in `lucide-react`.
- If interaction with the backend is needed, use TanStack Query V5. Try not to use React Context API
- Don't over-optimize, don't add meaningless `useMemo` and `useCallback`, especially don't add `useMemo` to data returned by Tanstack Query API hooks
- All text in the interface should be in English
- If importing other components, use `@/` absolute path imports
- Note that all code comments should be in English. Don't write obviously meaningless comments, and don't easily delete existing comments in the code
- Avoid using the any type in TypeScript.

## Output Requirements

- Provide reasonable file naming
  - File names must be named in lowercase snake case
  - File names should never have `_`, use `-` instead
- Generate complete Next.js component code. If you have save permissions, please save the file in the `apps/web/components/` folder under the corresponding component name
  - For example, when generating a `Login` component, it should be saved as `apps/web/components/login/index.tsx`
- Also generate usage examples of the component in the `apps/web/app/playground/components/` folder under the corresponding `component name`
  - For example, when generating a `Login` component, it should be saved as `apps/web/app/playground/components/login/page.tsx`
- Complex JSX pages need English comments. If Chinese comments are encountered, change them to English
- You can try to remind users to optimize meaningless `useMemo` and `useCallback` in the code

## `@nn-stack/ui` package rules

- You can only install shadcn component by using `pnpm dlx shadcn@latest add` command in `@nn-stack/ui` folder, for example: `pnpm dlx shadcn@latest add alert`.
- Never modify code in `@nn-stack/ui`


## API Development Rules

Before starting actual development, make sure to understand the latest versions of `Tanstack Query`, `Drizzle`, `Zod` v4 and `ORPC`. Feel free to use the context7 MCP server to query the latest documentation.

APIs development are based on [ORPC With Tanstack Query Integration](https://orpc.dev/docs/integrations/tanstack-query), should comply with their best practices

API development should be end-to-end type safe.

On the server side, use ORPC to define server APIs in the `@nn-stack/packages/api/src` subdirectory, and import them into the API entry point.

The API entry point is located at `apps/packages/api/src/index.ts`.

On the client side, use TanStack React Query in `@nn-stack/apps/web` to call the corresponding APIs, for example:

`const connectionCheck = useQuery(orpc.healthCheck.connection.queryOptions());`

