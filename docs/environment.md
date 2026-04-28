# Environment Variables & Deployment

## Env Files Per Stage

Each app reads a different env file depending on the stage. None are committed (gitignored).

| Stage | Command | env file |
|-------|---------|----------|
| Local dev | `pnpm dev` | `.local.env` |
| Cloudflare dev | `pnpm deploy:dev` | `.dev.env` |
| Cloudflare prod | `pnpm deploy:prod` | `.prod.env` |

## Local Development

Copy the example and fill in values:

```bash
cp apps/server/.local.env.example apps/server/.local.env
# Then create apps/tanstack/.local.env similarly.
```

Defaults:
- **`apps/tanstack/.local.env`**: `NEXT_PUBLIC_SERVER_URL=http://localhost:4000`
- **`apps/server/.local.env`**: `CORS_ORIGIN=http://localhost:3000`

## Adding New Environment Variables

1. **Do NOT manually edit `env.d.ts`** — auto-generated from `alchemy.run.ts`.
2. Edit `alchemy.run.ts` in the relevant app:
   - Locate the `bindings` object in the `Worker` configuration.
   - Add your variable (e.g., `MY_VAR: process.env.MY_VAR || ''`).
   - Define the variable in the app's `.local.env` for local development (and `.dev.env` / `.prod.env` for deploys).
3. Run `pnpm dev` — `env.d.ts` is auto-regenerated for type safety.

## Deployment

Uses Alchemy for Cloudflare Workers deployment:

```bash
pnpm run deploy:dev   # Development
pnpm run deploy:prod  # Production
```
