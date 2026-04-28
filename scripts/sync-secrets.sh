#!/usr/bin/env bash
# Sync stage env files to GitHub repository Secrets.
# Missing files are skipped with a warning (not an error).
#
# Usage:
#   scripts/sync-secrets.sh                # auto-detect default repo
#   scripts/sync-secrets.sh -R owner/name  # target a specific repo

set -u

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh CLI not found. Install: https://cli.github.com/"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "error: gh not authenticated. Run: gh auth login"
  exit 1
fi

REPO=""
while [ $# -gt 0 ]; do
  case "$1" in
    -R|--repo) REPO="$2"; shift 2 ;;
    *) echo "unknown arg: $1"; exit 1 ;;
  esac
done

if [ -z "$REPO" ]; then
  REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)
fi

if [ -z "$REPO" ]; then
  echo "error: cannot resolve default GitHub repo."
  echo "  Run: gh repo set-default     (then re-run)"
  echo "  Or:  pnpm sync:secrets -- -R owner/name"
  exit 1
fi

echo "→ syncing secrets to $REPO"
echo

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

pairs=(
  "ENV_SERVER_DEV:apps/server/.dev.env"
  "ENV_SERVER_PROD:apps/server/.prod.env"
  "ENV_WEB_DEV:apps/tanstack/.dev.env"
  "ENV_WEB_PROD:apps/tanstack/.prod.env"
)

synced=0
skipped=0

for pair in "${pairs[@]}"; do
  name="${pair%%:*}"
  rel="${pair#*:}"
  path="$ROOT/$rel"
  if [ ! -f "$path" ]; then
    echo "skip $name — $rel not found"
    skipped=$((skipped + 1))
    continue
  fi
  if gh secret set "$name" -R "$REPO" < "$path"; then
    echo "✓ $name <- $rel"
    synced=$((synced + 1))
  else
    echo "✗ $name failed to set"
    exit 1
  fi
done

echo
echo "synced=$synced skipped=$skipped"
