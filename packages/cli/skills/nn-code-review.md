# nn-code-review: Tunable-Depth Local Review

Runs a multi-dimensional review on the current changes and auto-fixes within a depth-capped loop.

**Arguments**: $ARGUMENTS

**Usage**:
- `/nn-code-review` — auto-detect depth
- `/nn-code-review --quick` — lightweight
- `/nn-code-review --deep` — thorough

---

## Three Depths

| | quick | medium (default) | deep |
|---|---|---|---|
| Context | diff only | changed lines ±50 | full files |
| Rounds | 1 | 2 | 3 |
| Dimensions | 1–2 | 1–4 | 1–6 |
| Speed / Tokens | fast / low | medium / medium | slow / high |

---

## Auto-Detection (no argument)

```
git diff dev --stat → parse file count N and total lines L
```

- Files ≤ 3 and L < 100 → **quick**
- Changes touch auth / path / permission / credential / secret / token / cookie / crypto code → **deep**
- Otherwise → **medium**

Quick heuristic for "security-related": `git diff dev --name-only` matches any of:
`auth|login|permission|secret|token|credential|cookie|crypto|password|session`

---

## Six-Dimension Checklist

1. **Correctness** — bugs, logic errors, off-by-one, null/undefined
2. **Obvious issues** — unused variables, type errors, missing `await`
3. **Consistency** — cross-file behavioral consistency (if A does X, B must too), uniform naming
4. **Framework usage** — correct API usage (`parse` vs `parseAsync`, event listener lifecycle)
5. **Security** — path traversal, injection, hostile input (`..`, `*`, special chars)
6. **Edge cases / robustness** — empty values, missing upstream, relative paths, race conditions

- **quick**: dimensions 1–2
- **medium**: dimensions 1–4
- **deep**: dimensions 1–6

---

## Execution Flow

### Step 1: Gather the diff

```bash
git diff dev --stat      # overview
git diff dev             # full diff
git diff dev --name-only # file list
```

If there are no changes → print `No changes, skipping review` and exit.

### Step 2: Build context

- quick: pass only the diff to the subagent
- medium: diff + ±50 surrounding lines per changed file
- deep: diff + full contents of each changed file

### Step 3: Launch a subagent

Call `Agent(subagent_type: "code-reviewer")` (fall back to `general-purpose` if unavailable), with a prompt containing:

1. The **dimension checklist** for this depth
2. The change set and context
3. The required output format:

```
| # | File | Line | Severity | Dimension | Description |
|---|------|------|----------|-----------|-------------|
| 1 | src/foo.ts | 42 | HIGH | Correctness | ... |
```

Severity: HIGH / MEDIUM / LOW / INFO

### Step 4: Analyze and fix

- Any HIGH or MEDIUM issue → main process applies `Edit`.
- After fixing, enter the next round (respect the depth's round cap).
- Only LOW / INFO left, or nothing at all → exit the loop.

### Step 5: Final status

Print a one-block summary to the transcript (do not write a file):

```
Code Review: <branch> — PASSED | FAILED
- Depth: quick | medium | deep
- Rounds: N
- Findings: total=X (HIGH:?, MEDIUM:?, LOW:?, INFO:?)
- Fixed: Y / Remaining: Z (one-line reason each)
```

Do NOT write a markdown file to `reviews/`. The commit diff + transcript is the audit trail; a separate report file rots and adds noise.

---

## Diff Baseline

**`git diff dev`** (PR target is `dev`). If `dev` is missing or stale locally, run `git fetch origin dev:dev` first.

---

## Rules

- Pass the **full diff + context** to the subagent every round (prompt caching handles repetition).
- Fixes touch only the necessary lines — no opportunistic refactors.
- Never create files under `reviews/`. Report status inline in the transcript.
