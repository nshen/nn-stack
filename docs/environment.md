# Environment Variables & Deployment

## Local Development

Each app uses a `.dev.env` file:

- **`apps/web/.dev.env`**: `FRONTEND=web` and `NEXT_PUBLIC_SERVER_URL=http://localhost:4000`
- **`apps/tanstack/.dev.env`**: `FRONTEND=tanstack` and `NEXT_PUBLIC_SERVER_URL=http://localhost:4000`
- **`apps/server/.dev.env`**: `CORS_ORIGIN=http://localhost:3000,http://localhost:3001`

## Adding New Environment Variables

1. **Do NOT manually edit `env.d.ts`** — auto-generated from `alchemy.run.ts`.
2. Edit `alchemy.run.ts` in the relevant app:
   - Locate the `bindings` object in the `Worker` configuration.
   - Add your variable (e.g., `MY_VAR: process.env.MY_VAR || ''`).
   - Define the variable in the app's `.dev.env` for local development.
3. Run `pnpm dev` — `env.d.ts` is auto-regenerated for type safety.

## Deployment

Uses Alchemy for Cloudflare Workers deployment:

```bash
pnpm --filter server --filter <frontend> deploy:dev   # Development
pnpm --filter server --filter <frontend> deploy:prod  # Production
```

Where `<frontend>` is `web` or `tanstack`.
