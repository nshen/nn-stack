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
- **`packages/db`**: Code related to Drizzle Cloudflare D1 database, including schema definitions for database tables.

## Tech Stack

| Category        | Technology           |
| --------------- | -------------------- |
| Package Manager | pnpm                 |
| Frontend        | Next.js, React Query |
| Backend         | Hono                 |
| API Layer       | ORPC, Zod            |
| UI Library      | Shadcn/ui, Radix UI  |
| Styling         | Tailwind CSS V4      |
| Code Quality    | Biome                |
| Deployment      | Alchemy.run          |

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

After each code modification, you should run `pnpm run lint` to ensure code quality, and fix any lint errors again.

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

### Environment Variables

For local development, we use `.dev.env` in `apps/web` and `apps/server` respectively and set the following values:

- **`apps/web/.dev.env`**: `NEXT_PUBLIC_SERVER_URL=http://localhost:4000` (Points to the local Hono server).
- **`apps/server/.dev.env`**: `CORS_ORIGIN=http://localhost:3000,http://localhost:3001` (Allows requests from the local Next.js app).

### Database

- **Define Schema**: We use Drizzle together with the D1 database, so we use the `drizzle-orm/sqlite-core` package to define the table schema, Be sure to import the type correctly. The schema definition file is saved in `packages/db/src/schema.ts`.
- **Generate Migrations**: After changing schemas in `packages/db/src/schema.ts`, run `pnpm run db:generate` from the `packages/db` directory to generate migrations.
- **Apply Migrations**: Since we use Alchemy.run to compile and run the program, when `pnpm dev` is executed, migrations are automatically applied in the local environment. When deploying, migrations are also automatically applied to the production environment.��

## Web Development Conventions

- **Monorepo Management**: pnpm workspaces are used to manage multiple packages within a single repository.
- **Code Style**: Enforced by Biome (linting and formatting).
- **API Definition**: The `@nn-stack/api` package defines the shared API contracts.
- **Database Schema Definition**: The `@nn-stack/db/src/schema.ts` file is used to define the d1 database table structure.
- **UI Components**: Reusable UI components are developed in the `@nn-stack/ui` package.

## Development Rules

Must comply with Next.js Hono oRPC best practices

## Constraints

- If the component is a client component, don't forget to add 'use client'
- If the page needs UI components, don't use native browser components. Must develop based on Shadcn UI components, imported from `@nn-stack/ui`. Restore the design to the maximum extent possible. If there are issues, you can use Shadcn's MCP tool.
- Only use tailwindcss V4 for styling. CSS inline styles are not allowed. Follow tailwindcss v4 built-in responsive design rules and mobile-first principles.
- If there are multiple ways to implement layout, prefer using grid or the most concise implementation method
- When components need icons, only use icons provided in `lucide-react`, no SVG allowed.
- If interaction with the backend is needed, use TanStack Query V5. Try not to use React Context API
- Don't over-optimize, don't add meaningless `useMemo` and `useCallback`, especially don't add `useMemo` to data returned by Tanstack Query API hooks
- The `cn` utility function must be imported from `@nn-stack/ui/lib/utils`. Do not create a local `lib/utils.ts` or import from `@/lib/utils`.
- All text in the interface should be in English
- If importing other components, use `@/` absolute path imports
- Note that all code comments should be in English. Don't write obviously meaningless comments, and don't easily delete existing comments in the code
- Avoid using the any type in TypeScript.

## UI/UX Design Principles (from Refactoring UI)

To ensure a high-quality, professional, and consistent user interface, all UI development should adhere to the principles from "Refactoring UI" by Adam Wathan and Steve Schoger. These principles are designed to be implemented with Tailwind CSS.

### 1. Spacing and Sizing

- **Use a Predefined Scale**: All margins, padding, widths, and heights should use the default Tailwind CSS spacing scale (which is based on a base unit of `0.25rem` or `4px`). Avoid arbitrary values (e.g., `margin-top: 13px`). This creates a more harmonious and rhythmic design.
- **Space is a Separator**: Instead of relying heavily on borders, use empty space (padding and margins) to group related elements and separate distinct ones.

### 2. Color

- **Start with a Limited Palette**: Don't define colors haphazardly. Establish a clear, constrained palette:
  - **Grays/Neutrals**: A set of 5-10 neutral grays for text, backgrounds, and subtle borders. Tailwind's `slate`, `gray`, `zinc`, `neutral`, `stone` scales are perfect for this.
  - **Primary Color**: One or two primary brand colors for key actions (buttons, links, active states).
  - **Semantic Colors**: Dedicated colors for success (green), warning (yellow/orange), and error (red) states.
- **Use Color with Purpose**: Use your primary color for primary actions only. Overusing it diminishes its impact. Most text should be a dark gray (e.g., `text-slate-800`), not pure black (`#000`), to be easier on the eyes.

### 3. Typography

- **Establish a Typographic Scale**: Use Tailwind's font-size scale (e.g., `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`). Don't use arbitrary font sizes.
- **Limit Font Weights**: Stick to a few font weights (e.g., `font-normal`, `font-medium`, `font-semibold`).
- **Hierarchy through Contrast**: Create a clear visual hierarchy not just with size, but with font weight and color. For example, a section title can be the same size as body text but with a heavier weight (`font-semibold`) and darker color.
- **Line Height Matters**: Use Tailwind's leading utilities (e.g., `leading-normal`, `leading-relaxed`) to ensure text is readable.

### 4. Visual Hierarchy and Depth

- **Use Shadows for Elevation**: Use shadows to lift interactive elements (like cards and dialogs) off the page. Use subtle shadows. Tailwind's `shadow-sm`, `shadow-md`, `shadow-lg` provide a great starting point.
- **Fewer Borders**: Borders can make a design feel busy. Prefer using box shadows or different background colors (`bg-slate-100`) to create separation between elements. When you must use a border, make it subtle (e.g., `border-slate-200`).

### 5. Component Design

- **Buttons**: Design clear primary (solid background), secondary (outline or lighter background), and tertiary (ghost/text-only) button styles. Ensure they have clear `hover` and `focus` states.
- **Forms**:
  - Place labels above their corresponding inputs.
  - Use a consistent height for all form controls (inputs, selects, buttons).
  - Provide highly visible `focus` states (e.g., a blue ring using `focus:ring-2`) to improve accessibility.
- **Icons**: Use icons from a single family (e.g., `lucide-react` as specified) and ensure they are consistently styled (e.g., all outline or all solid). Always pair an icon with text unless the meaning is universally understood (like a close 'X').

## Output Requirements

- Provide reasonable file naming
  - File names must be named in lowercase snake case
  - File names should never have `_`, use `-` instead
- Generate complete Next.js component code. If you have save permissions, please save the file in the `apps/web/components/` folder under the corresponding component name
  - For example, when generating a `Login` component, it should be saved as `apps/web/components/login/index.tsx`
- Also generate usage examples of the component in the `apps/web/app/playground/components/` folder under the corresponding `component name`
  - For example, when generating a `Login` component, it should be saved as `apps/web/app/playground/components/login/page.tsx`
- **Complex JSX Comments**: Complex JSX structures MUST have English comments to clearly separate and identify different UI sections. This makes it easier for humans to visually distinguish blocks (e.g., `{/* Header Section */}`, `{/* Main Content */}`). All comments must be in English.
- You can try to remind users to optimize meaningless `useMemo` and `useCallback` in the code

## `@nn-stack/ui` package rules

- You can only install shadcn component by using `pnpm dlx shadcn@latest add <component> -c packages/ui` command in root folder, `-c packages/ui` means install the component into `@nn-stack/ui` , for example: `pnpm dlx shadcn@latest add checkbox -c packages/ui`.
- Note: use `shadcn@latest`, not `shadcn-ui@latest`
- Never modify code in `@nn-stack/ui`

When a page in `apps/web` needs a UI component:

1. First, check if it exists in `@nn-stack/ui`.
2. If it does not exist, use the command `pnpm dlx shadcn@latest add <component> -c packages/ui` to add it to the ui package.
3. Finally, import and use it from `@nn-stack/ui` in the code of `apps/web`.

## API Development Rules

Before starting actual development, make sure to understand the latest versions of `Tanstack Query`, `Drizzle`, `Zod` v4 and `oRPC`. Feel free to use the context7 MCP server to query the latest documentation.

API development is end-to-end type safe by using oRPC.

In general, there is no need to modify the hono code in `@nn-stack/apps/server`, because hono has already integrated oRPC. You only need to create the corresponding oRPC API.

On the server side, use ORPC to define server APIs in the `@nn-stack/packages/api/src` subdirectory, and import them into the API entry point.

The API entry point is located at `apps/packages/api/src/index.ts`.

On the client side, use TanStack React Query in `@nn-stack/apps/web` to call the corresponding APIs, for example:

`const connectionCheck = useQuery(orpc.healthCheck.connection.queryOptions());`

APIs development are based on [ORPC With Tanstack Query Integration](https://orpc.dev/docs/integrations/tanstack-query), should comply with their best practices

### Seamlessly integrate oRPC with Tanstack Query

[Tanstack Query](https://tanstack.com/query/latest) is a robust solution for asynchronous state management. oRPC Tanstack Query integration is very lightweight and straightforward

#### Query Options

Use `.queryOptions` to configure queries. Use it with hooks like `useQuery`, `useSuspenseQuery`, or `prefetchQuery`.

```ts
const query = useQuery(
  orpc.planet.find.queryOptions({
    input: { id: 123 }, // Specify input if needed
    context: { cache: true }, // Provide client context if needed
    // additional options...
  }),
);
```

#### Mutation Options

Use `.mutationOptions` to create options for mutations. Use it with hooks like `useMutation`.

```ts
const mutation = useMutation(
  orpc.planet.create.mutationOptions({
    context: { cache: true }, // Provide client context if needed
    // additional options...
  }),
);

mutation.mutate({ name: "Earth" });
```

#### Query/Mutation Key

oRPC provides a set of helper methods to generate keys for queries and mutations:

- `.key`: Generate a **partial matching** key for actions like revalidating queries, checking mutation status, etc.
- `.queryKey`: Generate a **full matching** key for [Query Options](#query-options).
- `.streamedKey`: Generate a **full matching** key for [Streamed Query Options](#streamed-query-options).
- `.infiniteKey`: Generate a **full matching** key for [Infinite Query Options](#infinite-query-options).
- `.mutationKey`: Generate a **full matching** key for [Mutation Options](#mutation-options).

```ts
const queryClient = useQueryClient();

// Invalidate all planet queries
queryClient.invalidateQueries({
  queryKey: orpc.planet.key(),
});

// Invalidate only regular (non-infinite) planet queries
queryClient.invalidateQueries({
  queryKey: orpc.planet.key({ type: "query" }),
});

// Invalidate the planet find query with id 123
queryClient.invalidateQueries({
  queryKey: orpc.planet.find.key({ input: { id: 123 } }),
});

// Update the planet find query with id 123
queryClient.setQueryData(
  orpc.planet.find.queryKey({ input: { id: 123 } }),
  (old) => {
    return { ...old, id: 123, name: "Earth" };
  },
);
```

#### Calling Clients

Use `.call` to call a procedure client directly. It's an alias for corresponding procedure client.

```ts
const planet = await orpc.planet.find.call({ id: 123 });
```

#### Client Context

::: warning
oRPC excludes [client context](/docs/client/rpc-link#using-client-context) from query keys. Manually override query keys if needed to prevent unwanted query deduplication. Use built-in `retry` option instead of the [oRPC Client Retry Plugin](/docs/plugins/client-retry).

```ts
const query = useQuery(
  orpc.planet.find.queryOptions({
    context: { cache: true },
    queryKey: [["planet", "find"], { context: { cache: true } }],
    retry: true, // Prefer using built-in retry option
    // additional options...
  }),
);
```

:::

### Error Handling

Easily manage type-safe errors using our built-in `isDefinedError` helper.

```ts
import { isDefinedError } from "@orpc/client";

const mutation = useMutation(
  orpc.planet.create.mutationOptions({
    onError: (error) => {
      if (isDefinedError(error)) {
        // Handle type-safe error here
      }
    },
  }),
);

mutation.mutate({ name: "Earth" });

if (mutation.error && isDefinedError(mutation.error)) {
  // Handle the error here
}
```

::: info
For more details, see our [type-safe error handling guide](/docs/error-handling#type‐safe-error-handling).
:::

#### `skipToken` for Disabling Queries

The `skipToken` symbol offers a type-safe alternative to the `disabled` option when you need to conditionally disable a query by omitting its `input`.

```ts
const query = useQuery(
  orpc.planet.list.queryOptions({
    input: search ? { search } : skipToken, // [!code highlight]
  }),
);

const query = useInfiniteQuery(
  orpc.planet.list.infiniteOptions({
    input: search // [!code highlight]
      ? (offset: number | undefined) => ({ limit: 10, offset, search }) // [!code highlight]
      : skipToken, // [!code highlight]
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageParam,
  }),
);
```

## 测试

暂时无需执行测试
