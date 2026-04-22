# nn-pr-comments: Incremental PR Comment Fetch + Analysis

**Fetches and analyzes PR review comments. Never modifies code.** Code edits are the caller's job (e.g. `/nn-dev` main process).

**Arguments**: $ARGUMENTS

**Usage**:
- `/nn-pr-comments <pr-number>` — full analysis
- `/nn-pr-comments <pr-number> --since <lastReviewId>` — only comments with id > lastReviewId

---

## API Strategy (Minimize Traffic)

```bash
# 1. PR health (always — CI / mergeability / review states)
gh pr view <number> --json \
  number,title,baseRefName,headRefName,updatedAt,\
  mergeable,mergeStateStatus,reviewDecision,\
  statusCheckRollup,reviews

# 2. Inline review comments (client-side incremental filter by id)
gh api "repos/<owner>/<repo>/pulls/<number>/comments?per_page=100"

# 3. Only fetch the diff when there are new comments to analyze
gh pr diff <number>
```

**Cost**: 1 API call when there is nothing new; up to 3 when there are new comments.

---

## Filtering Rules

Against the array returned in step 2:

1. `in_reply_to_id != null` → **skip** (these are replies, not new review comments).
2. If `--since <id>` is provided → keep only `id > since`.
3. Dedupe by `id` and sort ascending.

If nothing remains → print `No new comments` plus the existing `lastReviewId`, then stop. **Do not fetch the diff.**

---

## Key Comment Fields

```json
{
  "id": 3091159289,
  "user": { "login": "Copilot", "type": "Bot" },
  "body": "comment body...",
  "path": "src/foo.ts",
  "line": 42,
  "diff_hunk": "@@ ... @@",
  "in_reply_to_id": null
}
```

---

## Fix vs Reply Criteria

| Suggestion | When to choose |
|------|------|
| **FIX** | Real bug, security issue, missing error handling, logic error, clearly beneficial improvement |
| **REPLY** | Conflicts with project conventions, misread, would break functionality, pure style preference, already superseded |
| **SKIP** | No actionable content ("nice!", "+1"), or already fixed in an earlier commit |

---

## Output Format

**Always emit the PR Health block first, then one per-comment block for every new comment.**

### PR Health (always)

```
## PR Health
- State: <OPEN|CLOSED|MERGED>
- CI: <pass N/M | fail K/M | pending | none> — <one-line summary of failing checks if any>
- Mergeable: <MERGEABLE|CONFLICTING|UNKNOWN> / <mergeStateStatus>
- Review decision: <APPROVED|CHANGES_REQUESTED|REVIEW_REQUIRED|none>
- Head sha reviewed: <yes|no> (head=<abbrev-sha>, last reviewed=<abbrev-sha|none>)
- New inline comments since lastReviewId=<id|null>: <N>
```

**CI details** — if any check has `conclusion` in `FAILURE|TIMED_OUT|CANCELLED|ACTION_REQUIRED`, list them:

```
### Failing checks
- <name> (<workflow>): <link>
- <name> (<workflow>): <link>
```

The caller (`/nn-dev`) uses this block to gate its flow (CI must pass before it trusts a merge-ready decision). Never skip this block.

### Per-comment blocks

**MANDATORY — emit this complete block for every new comment, even SKIP. Do not collapse multiple comments into a summary list. The caller needs the full body + diff_hunk + suggested patch to audit your FIX/REPLY decision.**

```
## Comment #<id> — @<reviewer>
File: <path>:<line>
Comment:
<comment body VERBATIM, preserve technical terms, translate non-English to English>

Code (diff_hunk):
<diff_hunk VERBATIM, inside a ``` fence>

Suggested patch: <only if the comment body contains a ```suggestion block>
<the suggestion content VERBATIM, inside a ``` fence>

Suggestion: FIX | REPLY | SKIP
  FIX   — Reason: <why it should be fixed>
  REPLY — Reason: <why it should not be changed>
           Draft reply: <proposed reply (English)>
  SKIP  — Reason: <why it can be skipped (name the commit that fixed it if applicable)>
```

Trailing summary:

```
---
New comments: N
Suggested fixes: X
Suggested replies: Y
Suggested skips: Z
Latest comment id: <max_id>
```

**Anti-patterns that lose information:**
- Paraphrasing the comment body instead of quoting it.
- Omitting the diff_hunk ("the reviewer is referring to X" is not enough).
- Dropping the GitHub ```suggestion ``` code block — it is often the exact patch the reviewer wants applied.
- Replacing three per-comment blocks with a three-row bullet list.

---

## Replying to PR Comments (caller's API, not called here)

```bash
gh api repos/<owner>/<repo>/pulls/<pr>/comments/<comment_id>/replies \
  -f body="Thanks for the suggestion. Keeping this as-is because ..."
```

---

## Rules

- **Never edit code.** Output analysis only.
- English output; preserve code, identifiers, and API names verbatim.
- Use `diff_hunk` and the current file for context; do not run extra Grep searches.
- If the comment body is in another language, translate to English; keep technical terms in English.
