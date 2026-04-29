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

## Syncing stage env to CI

CI (`.github/workflows/deploy.yml`) needs the same `.dev.env` / `.prod.env` content the local `deploy:dev` / `deploy:prod` commands consume. Since these files are gitignored, they reach CI via **GitHub Actions Secrets**.

Helper:

```bash
pnpm sync:secrets
```

This calls `scripts/sync-secrets.sh`, which uploads four files via `gh secret set`:

| Local file | GitHub Secret |
|---|---|
| `apps/server/.dev.env`   | `ENV_SERVER_DEV` |
| `apps/server/.prod.env`  | `ENV_SERVER_PROD` |
| `apps/tanstack/.dev.env` | `ENV_WEB_DEV` |
| `apps/tanstack/.prod.env`| `ENV_WEB_PROD` |

Missing files are skipped with a warning (so you can sync only dev secrets if prod isn't set up yet).

### How the round trip works

```
local working tree                GitHub Secrets               CI runner
──────────────────                ──────────────               ─────────
apps/server/.dev.env  ──[sync]──> ENV_SERVER_DEV  ──[inject]─> apps/server/.dev.env
apps/tanstack/.dev.env──[sync]──> ENV_WEB_DEV     ──[inject]─> apps/tanstack/.dev.env
                                                               │
                                                               ▼
                                                   alchemy deploy --stage dev
                                                     --env-file .dev.env
```

1. Locally, edit `.dev.env` and run `pnpm sync:secrets`
2. CI checks out a fresh tree (no `.dev.env` present), then `Inject env files (Dev)` step writes the secret content back to the exact path
3. `pnpm --filter server deploy:dev` runs `alchemy deploy --env-file .dev.env`, which pushes those values as Cloudflare Worker bindings
4. At runtime, the worker reads them via `env.X` (server) or `import.meta.env.NEXT_PUBLIC_X` (tanstack — bridged at build time by `vite-plugin-environment`)

`.prod.env` follows the identical path with `ENV_*_PROD` and the `prod` stage.

### Adding a new env var end-to-end

1. Add the binding in `alchemy.run.ts`
2. Add the value to `.local.env` (local dev), `.dev.env` (dev stage), `.prod.env` (prod stage)
3. `pnpm sync:secrets` to push `.dev.env` / `.prod.env` content to GitHub
4. Push your branch — CI redeploys with the new binding
5. Restart `pnpm dev` so `env.d.ts` regenerates with the new key

### One-time setup secrets

Not handled by `sync:secrets` (intentionally — they're set once and rarely rotate):

- `CLOUDFLARE_API_TOKEN`
- `ALCHEMY_STATE_TOKEN`
- `CLOUDFLARE_EMAIL`

Set these manually via `gh secret set` or the GitHub UI. See README "Required Secrets" for details.
