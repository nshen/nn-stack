# Plan: `nn w attach <branch>` — Attach Worktree to Existing Branch + PR

## Context

Today `nn w <name>` always creates a worktree under a *new* name and defaults the branch to `<name>` (identity — no prefix). It technically can reuse an existing branch (`packages/cli/src/commands/worktree/create.ts:71–76` calls `addWorktreeExisting` when `branchExists` is true), but the UX forces the user to invent a worktree name and pass `--branch` when the existing branch name contains `/` (since worktree names must match `VALID_NAME`), and `nn-state.json.pr` is never populated from an existing PR — so `/nn-dev` has nothing to resume polling against.

Goal: add a first-class "attach" path so that when a PR is already open on a branch, the user can drop into a worktree that mirrors it and hand it straight to `/nn-dev` for review polling.

## Design

New subcommand: `nn w attach <branch> [--as <name>] [--pr <n>]`.

- `<branch>`: the branch to attach to. May be local, remote-only (`origin/<branch>`), or just bare (`feat/foo`) — we'll try local, then `origin/<branch>`.
- `--as <name>`: override the worktree directory name. Default is the branch with `/` replaced by `-` (`feat/add-export` → `feat-add-export`), validated by the existing `VALID_NAME` rule. The branch name itself is never modified.
- `--pr <n>`: force a PR number and skip `gh` lookup.

Resolution order for `state.pr`:
1. If `--pr <n>` provided → use it directly.
2. Else run `gh pr list --head <branch> --state open --json number --jq '.[0].number'`. First open PR wins. If `gh` is missing, call fails, or returns empty → `state.pr = null` with a one-line notice; do not fail the command.

Branch resolution:
1. If branch exists locally → `addWorktreeExisting(wtPath, branch)`.
2. Else if `origin/<branch>` exists → `git fetch origin <branch>:<branch>` then attach (creates a local branch tracking origin).
3. Else → fail with a clear message; do not fall through to "create new branch" behavior (that belongs to `nn w <name>`).

If a worktree already exists at the target path, print its state and enter the subshell (same behavior as the `found` branch in `create.ts:103–109`). Do not overwrite `state.pr` on resume unless `--pr` was explicitly passed.

After setup: write state, print summary, enter subshell — reusing `enterSubshell` and `showExitPrompt` so behavior at exit is identical to `nn w <name>`.

## Files to Touch

| File | Change |
|------|--------|
| `packages/cli/src/cli.ts:41` | Register `w.command('attach')` just before `w.command('ls')`. |
| `packages/cli/src/cli.ts:8–25` | Add attach to the help block + examples. |
| `packages/cli/src/commands/worktree/attach.ts` *(new)* | `attachCommand(branch, opts)`. Shares `assertValidName`, `enterSubshell`, `showExitPrompt` logic with `create.ts` — extract `showExitPrompt` into a shared helper rather than duplicating. |
| `packages/cli/src/commands/worktree/create.ts:144–218` | Move `showExitPrompt` into `packages/cli/src/commands/worktree/_shared.ts` (or `lib/exit-prompt.ts`) and import from both. No behavior change. |
| `packages/cli/src/lib/git.ts` | Add `remoteBranchExists(name)` (uses `git show-ref --verify refs/remotes/origin/<name>`) and `fetchBranch(remote, branch)` (`git fetch <remote> <branch>:<branch>`). Reuse `branchExists` for the local check. |
| `packages/cli/src/lib/gh.ts` *(new)* | `getPrForBranch(branch): Promise<number \| null>`. Wrap `gh pr list --head <branch> --state open --json number --jq '.[0].number'` in a try/catch; return `null` on any failure. |
| `packages/cli/src/lib/state.ts` | No schema change — `pr` and `lastReviewId` already exist. |

## Helper Reuse

- `worktreeDirFor(name)` — `packages/cli/src/lib/paths.ts:13` — already does `../repo-worktrees/<name>`.
- `listWorktrees()` — `packages/cli/src/lib/git.ts:57` — check if target path is already a worktree.
- `writeState` / `readState` — `packages/cli/src/lib/state.ts:28,36`.
- `assertValidName` — currently private in `create.ts:22`; move to `_shared.ts` and import.

## Branch-to-Dir-Name Derivation

```ts
function deriveDirName(branch: string): string {
  // feat/add-export → feat-add-export; fix/bug → fix-bug; foo → foo
  // The branch itself is NOT modified — this only names the worktree directory.
  return branch.replace(/[^A-Za-z0-9._-]/g, '-')
}
```

If the derived name fails `VALID_NAME` (starts with `.` or `_`), prefix with `b-`.

## CLI Wire-up (cli.ts)

```ts
w.command('attach')
  .description('Attach a worktree to an existing branch (and its PR)')
  .argument('<branch>', 'existing branch name (local or origin/<branch>)')
  .option('--as <name>', 'worktree directory name (default: derived from branch)')
  .option('--pr <n>', 'PR number (skips gh lookup)', (v) => Number(v))
  .action(async (branch, opts) => {
    const { attachCommand } = await import('./commands/worktree/attach.js')
    await attachCommand(branch, opts)
  })
```

## Error Surface

- Branch exists neither locally nor on `origin` → exit 1 with `Branch "<x>" not found locally or on origin. Fetch it first, or use "nn w <name>" to create a new branch.`
- Worktree path collision with a different branch → refuse, print existing branch.
- `gh` missing or unauthenticated → print `note: gh not available — skipping PR lookup` and continue with `state.pr = null`.

## Verification

1. **Fresh attach with open PR** (the golden path):
   ```
   nn w attach feat/some-open-pr
   ```
   Expect: worktree at `../<repo>-worktrees/feat-some-open-pr`, branch stays `feat/some-open-pr`, `state.pr` set, subshell entered.
2. **Attach remote-only branch**: delete local branch, keep remote; `nn w attach <branch>` should fetch + track.
3. **Attach with `--as`**: `nn w attach feat/x --as work` → worktree dir `work`, branch unchanged.
4. **Attach with `--pr` override**: `nn w attach feat/x --pr 99` → `state.pr=99` even if gh returns a different number.
5. **Attach without gh on PATH**: `PATH= nn w attach feat/x` — should complete, warn, leave `state.pr=null`.
6. **Attach non-existent branch**: `nn w attach no-such` → exits non-zero with clear message.
7. **Re-attach** (worktree already exists): prints existing state, enters subshell, does not overwrite `state.pr`.
8. **Hand off to `/nn-dev`**: inside the attached worktree, `/nn-dev` (no args) should read `state.pr` and jump straight to Stage 4 polling.

Run `pnpm --filter @nn-stack/cli build && pnpm --filter @nn-stack/cli typecheck` before manual testing. No unit tests exist in `packages/cli` today; skipping adding a test harness as part of this change.

## Out of Scope

- No changes to `nn w <name>` behavior.
- No schema changes to `nn-state.json`.
- No auto-fetch of PR comments from this command (`/nn-dev` handles that).
- No multi-remote support — only `origin`.
