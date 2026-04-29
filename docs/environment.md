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
> The minimum update is: add the variable to the **Variable Reference** table below, plus any other section that mentions it (defaults, sync table, examples). Out-of-sync env docs are the most common cause of "works on my machine" failures in this repo.
>
> If the change is rename/remove only, audit each section of this doc and remove stale references too.

## TL;DR

Three layers of configuration, each with a different lifecycle:

| Layer | Where it lives | Who consumes it | Lifecycle |
|---|---|---|---|
| **Stage env files** (`.local.env` / `.dev.env` / `.prod.env`) | Per-app, gitignored | `alchemy --env-file` → Worker bindings | Edit → `pnpm sync:secrets` → CI injects → deploy |
| **One-time GitHub Secrets** | GitHub repo Secrets only | CI workflow at deploy time | Set once via `gh secret set`, rotate rarely |
| **Local-only env vars** | `.local.env` only | `alchemy dev` | Per-developer, never leave the machine |

---

## Variable Reference

Every env variable used by this project. **If you add a variable, add a row here.**

### Backend — `apps/server`

| Variable | Required? | Goes in | Purpose | How to obtain |
|---|---|---|---|---|
| `CORS_ORIGIN` | ✅ Required | `.local.env` / `.dev.env` / `.prod.env` | Comma-separated allow-list for Hono CORS middleware. Bound to the worker as a `vars` binding. Local dev: `http://localhost:3000`. Stage dev: `https://dev.nn.nshen.net`. Prod: `https://nn.nshen.net`. | Decide based on deployed frontend URL. |
| `R2_ACCESS_KEY_ID` | ⚠️ Optional | `.local.env` / `.dev.env` / `.prod.env` | Enables R2 storage routes (presigned uploads, listing, delete). Without it, R2 bindings are skipped and storage routes return errors. | Cloudflare dashboard → R2 → **Manage R2 API tokens** → **Create API token** with **Object Read & Write** scope on your buckets. Copy `Access Key ID`. |
| `R2_SECRET_ACCESS_KEY` | ⚠️ Optional | `.local.env` / `.dev.env` / `.prod.env` | Pair of `R2_ACCESS_KEY_ID`. Required together. | Same dialog as above — copy `Secret Access Key` (shown only once at creation). |

R2 also relies on these **derived bindings** that the server does NOT need in env files (alchemy fills them in):
- `BUCKET` — the R2Bucket resource binding
- `R2_ACCOUNT_ID` — your Cloudflare account ID, fetched at deploy time via `AccountId()`
- `R2_BUCKET_NAME` — `${app.name}-bucket-${app.stage}`
- `R2_PUBLIC_DOMAIN` — `BUCKET.devDomain` (the auto-issued `*.r2.dev` domain)

### Frontend — `apps/tanstack`

| Variable | Required? | Goes in | Purpose | How to obtain |
|---|---|---|---|---|
| `NEXT_PUBLIC_SERVER_URL` | ✅ Required | `.local.env` / `.dev.env` / `.prod.env` | Backend ORPC URL. **Inlined into the client bundle at build time** by `vite-plugin-environment` — the browser calls `${URL}/rpc`. | Local: `http://localhost:4000`. Dev stage: `https://dev.nn-server.nshen.net`. Prod: `https://nn-server.nshen.net`. |

> ⚠️ **`NEXT_PUBLIC_*` is visible in the browser bundle.** Never put secrets behind this prefix.

### One-time GitHub Secrets (not in stage env files)

These are set once via `gh secret set` (or the GitHub UI), not via `pnpm sync:secrets`. They power the deploy pipeline itself, not the running Workers.

| Secret | Required? | Purpose | How to obtain |
|---|---|---|---|
| `CLOUDFLARE_API_TOKEN` | ✅ Required | Lets `alchemy deploy` call the Cloudflare API to create/update Workers, D1, KV, R2, custom domains. | `pnpm alchemy login` then `pnpm dlx alchemy util create-cloudflare-token` (mirrors your OAuth scopes). For full access: `--god-token`. Manual: <https://dash.cloudflare.com/profile/api-tokens> with **Workers Scripts**, **Workers KV**, **Workers R2**, **D1** all set to *Edit*, plus **Zone → Workers Routes: Edit** for any zone whose domain you bind. |
| `CLOUDFLARE_EMAIL` | ✅ Required | Used with `CLOUDFLARE_API_TOKEN` for the legacy CF API endpoints `CloudflareStateStore` hits at the account level. | Your Cloudflare login email. No generation step. |
| `ALCHEMY_STATE_TOKEN` | ✅ Required | Authenticates against `CloudflareStateStore` — the Durable Object worker (`alchemy-state-service`) that persists deployment state across CI runs. Without it, alchemy can't read prior state and may try to recreate existing resources. | `openssl rand -hex 32`. Use the **same token across all projects** under the same Cloudflare account that share the state worker. |
| `ALCHEMY_PASSWORD` | ⚠️ Optional | Encrypts values wrapped with `alchemy.secret(process.env.X)` at rest. **This project doesn't currently use `alchemy.secret()`** — sensitive values flow via `--env-file`. Only needed if you adopt that API. | `openssl rand -base64 32`. **Never change it after creating the first encrypted secret** — old encrypted values become unreadable. |

---

## Env Files Per Stage

| Stage | Command | env file | Notes |
|---|---|---|---|
| Local dev | `pnpm dev` | `apps/*/`.local.env` | Per-developer, gitignored. Never reaches CI. |
| Cloudflare dev | `pnpm deploy:dev` | `apps/*/.dev.env` | Synced to GitHub Secret `ENV_*_DEV`, injected by CI on `dev` branch push. |
| Cloudflare prod | `pnpm deploy:prod` | `apps/*/.prod.env` | Synced to GitHub Secret `ENV_*_PROD`, injected by CI on `main` branch push. |

All three are `.env`-format (key=value, no quotes needed). All three are gitignored. Only `*.env.example` files are committed.

---

## Local Development

Copy each example and fill values:

```bash
cp apps/server/.local.env.example  apps/server/.local.env
cp apps/tanstack/.local.env.example apps/tanstack/.local.env
```

The defaults already work for `pnpm dev` (server on `:4000`, tanstack on `:3000`). Add your `R2_*` keys to `apps/server/.local.env` if you want to test R2 features locally.

---

## Deployment

Alchemy handles Cloudflare Workers deployment:

```bash
pnpm run deploy:dev   # all apps to dev stage
pnpm run deploy:prod  # all apps to prod stage
```

CI runs the same commands automatically when you push to `dev` / `main` (see `.github/workflows/deploy.yml`).

---

## Syncing stage env to CI

CI (`.github/workflows/deploy.yml`) needs the same `.dev.env` / `.prod.env` content the local `deploy:dev` / `deploy:prod` commands consume. Since these files are gitignored, they reach CI via **GitHub Actions Secrets**.

Helper:

```bash
pnpm sync:secrets
```

This calls `scripts/sync-secrets.sh`, which uploads four files via `gh secret set`:

| Local file | GitHub Secret |
|---|---|
| `apps/server/.dev.env`    | `ENV_SERVER_DEV` |
| `apps/server/.prod.env`   | `ENV_SERVER_PROD` |
| `apps/tanstack/.dev.env`  | `ENV_WEB_DEV` |
| `apps/tanstack/.prod.env` | `ENV_WEB_PROD` |

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

---

## Adding a new env var end-to-end

1. **Add the binding** in the relevant `apps/*/alchemy.run.ts`:
   ```ts
   bindings: {
     ...,
     MY_VAR: process.env.MY_VAR || '',
   }
   ```
2. **Add to all three stage files**:
   - `apps/<app>/.local.env` (your local value)
   - `apps/<app>/.dev.env` (dev stage value)
   - `apps/<app>/.prod.env` (prod stage value)
3. **Add to the example**: append a documented entry to `apps/<app>/.local.env.example`
4. **Add to this doc**: update the **Variable Reference** table above
5. **Sync to CI**: `pnpm sync:secrets`
6. **Deploy**: push your branch — CI redeploys with the new binding
7. **Restart `pnpm dev`**: `env.d.ts` regenerates so TS knows about `env.MY_VAR`

For frontend (`apps/tanstack`), step 1 is different: the variable must be prefixed `NEXT_PUBLIC_` to be inlined into the client bundle (no alchemy binding needed for client-bundled values).

---

## Bootstrapping a fresh fork

```bash
# 1. Cloudflare auth (creates ~/.alchemy/profile)
pnpm alchemy login

# 2. Generate the API token
pnpm dlx alchemy util create-cloudflare-token

# 3. Generate the state token
openssl rand -hex 32

# 4. Set the four GitHub Secrets that aren't in stage env files
gh secret set CLOUDFLARE_API_TOKEN      # paste from step 2
gh secret set CLOUDFLARE_EMAIL          # your CF login email
gh secret set ALCHEMY_STATE_TOKEN       # paste from step 3
# ALCHEMY_PASSWORD: skip unless you start using alchemy.secret()

# 5. Create stage env files
cp apps/server/.local.env.example  apps/server/.dev.env
cp apps/tanstack/.local.env.example apps/tanstack/.dev.env
# Edit them — change URLs, add R2 keys if needed
# Repeat for .prod.env

# 6. Upload stage env files to GitHub Secrets
pnpm sync:secrets

# 7. Push — CI deploys to dev / prod
git push origin dev
```
