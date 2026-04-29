# Environment Variables & Deployment

> **Maintenance rule (must follow)**
>
> If your change touches any of the following, you MUST update this document **in the same commit**:
>
> - `bindings: { ... }` in any `apps/*/alchemy.run.ts` (added / removed / renamed key)
> - Any `.local.env`, `.dev.env`, `.prod.env`, or `*.env.example` file (added / removed / renamed variable)
> - The `vite-plugin-environment` prefix or `define` in `apps/tanstack/vite.config.ts`
> - The injection steps in `.github/workflows/deploy.yml`
> - The `scripts/sync-secrets.sh` mapping table
>
> The minimum update is: add the variable to the relevant section below (Local Development defaults, Adding New Environment Variables walkthrough, or the sync table) so a fresh fork knows how to set it up. Out-of-sync env docs are the most common cause of "works on my machine" failures in this repo.
>
> If the change is rename/remove only, audit each section of this doc and remove stale references too.

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

These are set once and rarely rotate, so they're intentionally not in `sync:secrets`. Set them manually via `gh secret set` or the GitHub UI.

#### `CLOUDFLARE_API_TOKEN`

**Purpose**: lets `alchemy deploy` call the Cloudflare API to create / update Workers, D1 databases, KV namespaces, R2 buckets, and custom domains.

**How to get** (recommended — minimal scope):

```bash
pnpm dlx alchemy util create-cloudflare-token
```

This generates a token mirroring your local OAuth profile permissions (run `pnpm alchemy login` first if you haven't).

For a full-access token (less secure but simpler):

```bash
pnpm dlx alchemy util create-cloudflare-token --god-token
```

Or create one manually at <https://dash.cloudflare.com/profile/api-tokens> with these permissions:
- Account → Workers Scripts: Edit
- Account → Workers KV Storage: Edit
- Account → Workers R2 Storage: Edit
- Account → D1: Edit
- Zone → Workers Routes: Edit (only for the zones whose domains you bind)

#### `ALCHEMY_STATE_TOKEN`

**Purpose**: authenticates against the `CloudflareStateStore` — a Durable Object Worker (`alchemy-state-service`) that alchemy uses to persist deployment state across CI runs. Without persistent state, alchemy would think every deploy is the first one and try to create resources that already exist.

**How to get**: any random 32-character hex string. The same token must be used by every CI deploy of this project, and across all your projects under the same Cloudflare account if they share the state worker.

```bash
openssl rand -hex 32
```

Then `gh secret set ALCHEMY_STATE_TOKEN` paste the value.

#### `CLOUDFLARE_EMAIL`

**Purpose**: used together with `CLOUDFLARE_API_TOKEN` for the few legacy Cloudflare API endpoints that still require email-based auth (mostly account-level operations the state store hits).

**How to get**: it's the email address you log into Cloudflare with. No generation step.

#### `ALCHEMY_PASSWORD` (optional, only if you use `alchemy.secret()`)

**Purpose**: encrypts secrets stored in alchemy state (the `.alchemy/` directory locally, or the state store remotely). When you wrap a value with `alchemy.secret(process.env.X)` to bind it to a Worker, alchemy encrypts it at rest using this password.

This project doesn't currently use `alchemy.secret()` — sensitive values flow through stage env files and `--env-file`. If you start using `alchemy.secret()`, generate a long random string:

```bash
openssl rand -base64 32
```

Set it as `ALCHEMY_PASSWORD` and never change it after creating the first secret (changing it makes existing encrypted values unreadable).

### Bootstrapping a fresh fork

```bash
# 1. Cloudflare auth (creates ~/.alchemy/profile)
pnpm alchemy login

# 2. Generate the API token
pnpm dlx alchemy util create-cloudflare-token

# 3. Generate the state token
openssl rand -hex 32

# 4. Set GitHub Secrets
gh secret set CLOUDFLARE_API_TOKEN     # paste from step 2
gh secret set CLOUDFLARE_EMAIL         # your CF login email
gh secret set ALCHEMY_STATE_TOKEN      # paste from step 3

# 5. Create stage env files (.dev.env / .prod.env), then push them
pnpm sync:secrets
```
