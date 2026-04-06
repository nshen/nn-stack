# API Development

API development is end-to-end type safe using oRPC.

Before starting, make sure to understand the latest versions of `TanStack Query`, `Drizzle`, `Zod` v4 and `oRPC`. Use `pnpm ctx7 docs <libraryId> "<query>"` to look up the latest documentation (run `pnpm ctx7 library <name> "<query>"` first to find the library ID).

## Architecture

- **Server side**: Define oRPC APIs in `packages/api/src/`, import them into the API entry point at `packages/api/src/index.ts`.
- **Client side**: Use TanStack React Query in the active frontend app to call APIs.
- No need to modify the Hono code in `apps/server` — Hono has already integrated oRPC. You only need to create the corresponding oRPC API.

## oRPC + TanStack Query Integration

APIs are based on [oRPC With TanStack Query Integration](https://orpc.dev/docs/integrations/tanstack-query).

### Query Options

Use `.queryOptions` to configure queries. Use with `useQuery`, `useSuspenseQuery`, or `prefetchQuery`.

```ts
const query = useQuery(
  orpc.planet.find.queryOptions({
    input: { id: 123 },
    context: { cache: true },
  }),
);
```

### Mutation Options

Use `.mutationOptions` for mutations with `useMutation`.

```ts
const mutation = useMutation(
  orpc.planet.create.mutationOptions({
    context: { cache: true },
  }),
);

mutation.mutate({ name: "Earth" });
```

### Query/Mutation Key

oRPC provides helper methods to generate keys:

- `.key`: **Partial matching** key for revalidating queries, checking mutation status, etc.
- `.queryKey`: **Full matching** key for Query Options.
- `.mutationKey`: **Full matching** key for Mutation Options.

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

### Calling Clients

Use `.call` to call a procedure client directly.

```ts
const planet = await orpc.planet.find.call({ id: 123 });
```

### Client Context

oRPC excludes client context from query keys. Manually override query keys if needed to prevent unwanted query deduplication. Use built-in `retry` option instead of the oRPC Client Retry Plugin.

```ts
const query = useQuery(
  orpc.planet.find.queryOptions({
    context: { cache: true },
    queryKey: [["planet", "find"], { context: { cache: true } }],
    retry: true,
  }),
);
```

### Error Handling

Use the `isDefinedError` helper for type-safe error handling.

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
```

### `skipToken` for Disabling Queries

Use `skipToken` as a type-safe alternative to `disabled` when conditionally disabling a query.

```ts
const query = useQuery(
  orpc.planet.list.queryOptions({
    input: search ? { search } : skipToken,
  }),
);
```
