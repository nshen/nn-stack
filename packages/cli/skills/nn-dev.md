# nn-dev: End-to-End Development Orchestrator

Orchestrates the full dev flow: develop → local review → local verify → commit + push → open PR → poll review comments → auto-fix/reply → loop until merge-ready.

**Arguments**: $ARGUMENTS

**Usage**:
- `/nn-dev <plan text or .md file path>` — start from the development stage
- `/nn-dev` — skip development, start from the review stage

---

## Control Flow — Read First

**You are the orchestrator.** There is no other agent driving these stages. When a sub-skill you invoke (`nn-code-review`, `nn-pr-comments`) returns, control comes back to **you** — the main process. You MUST continue directly into the next stage **in the same turn**, without waiting for user input, without announcing "returning control," and without ending the turn.

**Anti-patterns that have caused breakage:**
- Ending the turn after `Skill(nn-code-review)` returns without starting Stage 3.
- Writing "handing off to the orchestrator" — you ARE the orchestrator.
- Treating each stage as a separate /nn-dev invocation unless explicitly scheduled by `ScheduleWakeup`.

**Stage transitions are mandatory and immediate:**
- Stage 1 done → Stage 2 (same turn)
- Stage 2 done → Stage 3 (same turn)
- Stage 3 done → Stage 4 (same turn)
- Stage 4 done → Stage 5 first tick (same turn)
- Stage 5 only ends the turn when it calls `ScheduleWakeup` for the next poll, OR when it reaches Stage 6.

If you catch yourself about to write "next I'll …" or "now returning to …" between stages, do not. Just call the next tool.

---

## Stage 0: Preflight

All worktree/state plumbing is delegated to the `nn` CLI (`@nn-stack/cli`). Resolve it once, then reuse `$NN` in every stage below:

```bash
# Resolve the nn binary: prefer globally installed, fall back to npx.
# `-y` is required because skills run non-interactively — without it, npx
# would hang on its first-install prompt.
if command -v nn >/dev/null 2>&1; then
  NN=nn
else
  NN="npx -y @nn-stack/cli"
fi

# Fetch worktree info as JSON; exits 1 if not in a git repo.
info=$($NN w current --json) || {
  echo "❌ Not in a git repo."
  exit 1
}

is_linked=$(echo "$info" | node -e 'process.stdin.on("data",d=>process.stdout.write(JSON.parse(d).isLinked?"1":"0"))')
if [ "$is_linked" != "1" ]; then
  echo "❌ Not inside an nn worktree. Create one first:"
  echo "  nn w <name>                       create and enter a worktree"
  echo "  nn w <name> --branch <branch>     with a specific branch name"
  exit 1
fi

# Pull fields out of the JSON blob for downstream stages.
branch=$(echo "$info"     | node -e 'process.stdin.on("data",d=>process.stdout.write(JSON.parse(d).branch||""))')
owner=$(echo "$info"      | node -e 'process.stdin.on("data",d=>process.stdout.write(JSON.parse(d).owner||""))')
repo=$(echo "$info"       | node -e 'process.stdin.on("data",d=>process.stdout.write(JSON.parse(d).repo||""))')
owner_repo="$owner/$repo"
```

On any preflight failure, exit with a clear message.

> **Why `nn` instead of raw git?** — the skill is distributed as a Claude Code plugin; bundling the state I/O behind `nn` means the plugin doesn't need to re-derive `$gitdir/nn-state.json` by hand and can stay stable if the state format ever changes. Users who haven't installed `@nn-stack/cli` globally transparently fall through to `npx -y @nn-stack/cli` (one-time download, cached afterwards).

---

## Stage 1: Development (optional)

- If `$ARGUMENTS` is non-empty:
  - When the argument ends in `.md` and the file exists → `Read` that file as the plan
  - Otherwise, treat the argument itself as the plan
  - Execute the plan (Edit / Write source files)
  - If the plan contains the string `invoke /opsx:apply`, call that skill
- If `$ARGUMENTS` is empty → skip to Stage 2

---

## Stage 2: Local Review

Call `Skill(skill: "nn-code-review")` for multi-dimensional review + auto-fix, capped at 3 rounds.

Proceed once the review passes (only LOW/INFO issues remain, or none at all).

**→ When the skill returns, do NOT stop. Immediately begin Stage 3 in the same turn.** The skill prints its summary inline — there is no file artifact to review or wait on.

---

## Stage 3: Local Verify

**Never push red code hoping CI will tell you.** Run the project's verification locally first; fix; push only when green.

1. **Detect scripts** from the root `package.json` (or the changed workspace's `package.json`):
   - `typecheck` — always run if present.
   - `lint` — run if present; warnings are OK, errors block.
   - `build` — run if present and the change touches compiled code.
   - `test` — run if present. No test script in the repo → note "no project tests defined" and skip.
2. Pick the most specific scope that covers the change:
   - Change in one workspace → `pnpm --filter <pkg> <script>`.
   - Change spans multiple workspaces → `pnpm -r <script>` or root script.
3. If any step fails:
   - Fix the failure with `Edit`. Scope the fix tightly to the error.
   - Re-run the failing step. Cap at **3 fix attempts**. If still failing on attempt 4 → stop and ask the user; do not push.
4. All green → **Immediately continue to Stage 4 in the same turn.**

Rationale: CI turnaround is expensive (minutes vs. seconds locally) and a red push burns a poll cycle in Stage 5.0.

---

## Stage 4: Commit + Push + Open PR

1. `git status --porcelain` — if empty, skip steps 2–5 but still run the PR-lookup/update below (a retry after a clean-tree restart still needs the PR + state wired up).
2. `git add -A` (sensitive files must already be in .gitignore).
3. Generate a commit message from `git diff --cached --stat`:
   - One-line subject + a brief description of what changed (no rationale).
   - Format: `<type>: <summary>` where type ∈ feat/fix/refactor/docs/test/chore.
4. `git commit -m "<msg>"`
5. `git push -u origin "$branch"`
6. Check PR: `gh pr view --json number,url 2>/dev/null`
7. No PR → `gh pr create --base dev --fill`; parse the PR number from the returned URL.
8. **Request Copilot re-review on the new head sha** — the repo's auto-review ruleset is unreliable in practice (observed silently skipping follow-up pushes), so always fire this explicitly. The identifier MUST include the `[bot]` suffix:

```bash
gh api -X POST "/repos/$owner_repo/pulls/$pr_number/requested_reviewers" \
  -f "reviewers[]=copilot-pull-request-reviewer[bot]" >/dev/null 2>&1 || true
```

Failure is non-fatal (no Copilot enabled, or a review already pending — both return non-zero). Do not retry.

9. Update state:

```bash
$NN state set pr "$pr_number"
```

**→ Immediately run Stage 5's first poll tick in the same turn. Do not end the turn here.**

---

## Stage 5: Poll Review Comments

**Loop counter** stored in `nn-state.json` (persists across wakes). Read with `$NN state get <k>`, write with `$NN state set <k> <v>`:
- `emptyWaitCount` — empty polls while waiting for the first review ever. Only used as an escape hatch when Copilot is unreachable. Reset to `0` after any Stage 4 / Stage 5.5 push.

Each wake does:

### 5.0 CI gate (runs FIRST, before comment analysis)

`/nn-pr-comments` always emits a **PR Health** block. Read it first and act on CI before anything else:

- **CI fail** (any check `FAILURE|TIMED_OUT|CANCELLED|ACTION_REQUIRED` on the head sha):
  1. Fetch the failing check's log: `gh run view <run-id> --log-failed` (get `run-id` from the health block's links) or `gh pr checks <pr>` to identify it.
  2. Read the failing files and attempt a fix. Scope the fix tightly to the CI error (don't bundle unrelated cleanup).
  3. If fixed → `git add -A && git commit -m "fix: restore CI" && git push`, reset both counters to 0, `ScheduleWakeup(180s)`. **Do not proceed to 5.1 this tick.**
  4. If you cannot fix (unclear root cause, infra flake, needs human judgment) → **stop the loop** and ask the user. Do not declare merge-ready.
- **CI pending** (any check `IN_PROGRESS|QUEUED|PENDING`, none failing): `ScheduleWakeup(180s)`, do not increment empty counters (tests still running isn't an empty poll). Continue to 5.1 only if you want to still analyze existing comments — usually skip.
- **CI pass** (all checks green, or no checks configured): proceed to 5.1.
- **Mergeable = CONFLICTING**: stop the loop, print a notice, ask user to rebase/resolve. Do not auto-rebase.

### 5.1 Fetch and analyze new comments

Invoke `/nn-pr-comments <pr-number> [--since <lastReviewId>]`. The skill MUST emit the PR Health block AND the full per-comment block (see `/nn-pr-comments`'s output format). Do not accept a collapsed summary — if you only see one-line summaries, re-run the skill or parse the API response yourself.

### 5.2 Branch: no new comments

Before counting a tick as "empty," verify the **latest commit has been reviewed**:

```bash
head_sha=$(git rev-parse HEAD)
last_reviewed_sha=$(gh pr view <pr> --json reviews --jq '.reviews | map(.commit.oid) | .[-1] // ""')
```

- If `last_reviewed_sha != head_sha` → the latest push hasn't been reviewed yet. **Do not increment any counter.** `ScheduleWakeup(delaySeconds: 180)` and return.
- Otherwise (head sha has been reviewed at least once):
  - `lastReviewId` is non-empty (this round AND prior rounds are all accounted for): **jump to Stage 6 immediately.** A Copilot review that landed on the current head with zero new comments is a clean pass; there's nothing to wait for. Do not increment counters.
  - `lastReviewId` is empty (first review ever, returned zero comments): also proceed to Stage 6 — Copilot approved on first look.

**Escape hatch for stalled first review** — if the head sha has never been reviewed AND `lastReviewId` is empty, still increment `emptyWaitCount` and bail out after `>= 5` ticks (~15 min) to avoid a forever-loop when Copilot is unreachable or disabled on this repo:

```text
If last_reviewed_sha == "" AND lastReviewId is empty:
  emptyWaitCount++; if >= 5 → Stage 6; else ScheduleWakeup(180s)
```

Persist updated counters back to `nn-state.json` before scheduling.

### 5.3 Branch: new comments exist

**For each comment, before acting, echo the full comment block into the transcript** (id, file:line, body, diff_hunk, suggested patch if present). This gives the user an audit trail — do not collapse multiple comments into one summary line. Then the **main process** (not a subagent) makes the final call:

1. `Read` the file referenced by the comment to grasp full context.
2. Combine the FIX/REPLY/SKIP suggestion from `/nn-pr-comments` with on-disk code and decide the outcome:
   - **FIX** and the main process agrees with the reviewer's `suggestion` verbatim → `Edit` the code as suggested. State the before→after reasoning in one sentence.
   - **FIX** but the main process deviates from the exact `suggestion` (e.g. suggested patch is subtly wrong) → `Edit` with the corrected version. State what you did differently and why.
   - **REPLY** / the main process rejects the suggestion → do not edit. Hold the disagreement for 5.4.
   - **SKIP** (already fixed / duplicate) → no edit. Identify the prior commit that addressed it.

### 5.4 Reply only when you diverge from the reviewer

Reply via the GitHub API **only** when your action is not an exact execution of the reviewer's request — the commit itself speaks for straight-apply cases. Posting "Applied — thanks" on every comment is noise. Reply is mandatory in these three cases:

1. **REPLY** — you disagree and are not changing the code.
2. **SKIP** — the comment is already addressed in a prior commit or is a duplicate.
3. **FIX with deviation** — you agree with the concern but did not apply the suggested patch verbatim (e.g. the reviewer's patch was subtly wrong, the fix needed a wider scope, or you picked a different approach).

```bash
gh api -X POST "/repos/$owner_repo/pulls/<pr>/comments/<comment_id>/replies" \
  -f body="<English reply, 1–3 sentences>"
```

Reply content by outcome:
- **FIX with deviation**: `"Agree with the concern — applied a different fix in <short-sha> because <specific reason>. <1 sentence on what was actually done>."` Do not skip this one; without it, the next reviewer (or the same bot on next review) cannot tell that you considered and rejected the original patch.
- **REPLY (disagree)**: `"Keeping as-is: <reason>. <Brief pointer to the convention or file that governs this>."`
- **SKIP (already addressed)**: `"Already addressed in <short-sha>: <what that commit did>."`

When the outcome is **FIX applied as suggested**, do NOT reply — the commit referencing the PR is audit trail enough.

Post the reply **before** Stage 5.5's commit so the disagreement/deviation is visible in GitHub even if the process is interrupted.

If `gh api .../replies` returns a non-zero exit code, log the error and continue with the next comment; do not retry-loop.

### 5.5 Commit and schedule the next tick

- If any code changed → `git add -A && git commit -m "fix: address review feedback" && git push`.
- After a push, **request Copilot re-review on the new head** (same call as Stage 4 step 8):

  ```bash
  gh api -X POST "/repos/$owner_repo/pulls/<pr>/requested_reviewers" \
    -f "reviewers[]=copilot-pull-request-reviewer[bot]" >/dev/null 2>&1 || true
  ```

- Update state: `lastReviewId = <max id this round>` (write it even if nothing was changed, so the same comments are not re-analyzed).
- After a push, **reset `emptyWaitCount = 0`** — the new commit needs a fresh review cycle.
- `ScheduleWakeup(delaySeconds: 180, prompt: "/nn-dev", reason: "polling PR #<pr> reviews")`.

---

## Stage 6: Completion Notice

### 6.1 Self-doubt check (REQUIRED, before the health gate)

Bots and skill loops are optimistic. Before claiming ready, step back:

1. Read `git log dev..HEAD --oneline` and `git diff dev --stat`.
2. Write 3–5 sentences answering honestly:
   - What is the **real risk surface** of this change? Name it concretely — not "things might break."
   - Which edge case (empty input, concurrency, auth boundary, unusual env, migration path, backwards compat) did I NOT exercise? Be specific about the scenario.
   - If a user files a P0 issue against this PR in 3 months, what would it most likely be about?
3. Do not edit code during this check — just think and write.
4. If your answers surface a concrete concern:
   - **Fixable now** → treat it like a review finding: edit, commit, push, reset counters, go back to Stage 5.0.
   - **Needs user judgment** (e.g., "this might deadlock under concurrent writes but I can't reproduce") → stop the loop, print the concern clearly, ask the user. Do not declare ready.
5. Only if the check yields "no concrete concern" → proceed to 6.2.

This step is the last line of defense against Copilot-approved bugs that are obvious in hindsight.

### 6.2 Health gate

Re-check the last PR Health block. All of these must hold:
- CI: pass (no FAILURE / TIMED_OUT / CANCELLED on head sha).
- Mergeable: not CONFLICTING.
- No outstanding CHANGES_REQUESTED review on the head sha.

If any of these fail → do NOT enter 6.3. Return to Stage 5.0 (CI fix) or print a blocker notice and stop.

### 6.3 Completion Notice

When 6.1 and 6.2 both pass, print:
- PR URL
- Totals: comments processed / fixes applied / replies posted
- CI status (pass N/N) + reviewDecision
- Self-doubt check summary (one line: "no concrete concern" or the concern that was fixed)
- "✅ PR is ready — please review and merge"

**Do not** call `ScheduleWakeup`. The loop terminates.

---

## Shared nn-state.json I/O

All read/write goes through the `nn` CLI resolved in Stage 0. Do **not** parse `.git` or hand-roll `node -e` scripts — keep the skill implementation-agnostic so the state format can evolve inside `@nn-stack/cli`.

```bash
# Read a single key (empty stdout if unset).
pr=$($NN state get pr)

# Read all keys as JSON.
state=$($NN state show --json)

# Write. Numeric strings are stored as numbers automatically.
$NN state set pr 123
$NN state set emptyWaitCount 0

# Write non-scalar (boolean / array / object): use --json.
$NN state set someFlag true --json
```

---

## Out of Scope

- No auto-merge.
- No rebase / conflict resolution (stop and ask the user).
- Do not modify existing commands like `/nn-review-loop`, `/nn-pr-review`.
