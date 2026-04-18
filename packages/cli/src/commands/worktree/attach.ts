import fs from 'node:fs/promises'
import path from 'node:path'
import { getPrForBranch } from '../../lib/gh.js'
import {
  addWorktreeExisting,
  branchExists,
  fetchBranch,
  listWorktrees,
  remoteBranchExists,
} from '../../lib/git.js'
import {
  assertValidName,
  getRepoInfo,
  worktreeDirFor,
} from '../../lib/paths.js'
import { type NNState, readState, writeState } from '../../lib/state.js'
import { enterSubshell } from '../../lib/subshell.js'
import { handleSubshellExit } from './_shared.js'

export async function attachCommand(
  rawBranch: string,
  opts: { as?: string; pr?: number; printPath?: boolean },
) {
  // Accept "origin/foo" as a convenience when users paste from `git branch -r`.
  // Only strip the prefix if no local branch exists with that literal name —
  // this preserves legitimate local branches named "origin/foo".
  let branch = rawBranch
  if (rawBranch.startsWith('origin/') && !(await branchExists(rawBranch))) {
    branch = rawBranch.slice('origin/'.length)
  }
  const name = opts.as ?? branch
  assertValidName(name)

  const wtPath = await worktreeDirFor(name)
  const existing = await listWorktrees()
  const found = existing.find((e) => e.path === wtPath)

  let resolvedBranch: string | null = branch
  let isResume = false

  if (found) {
    // Worktree already exists — only resume if it matches the requested branch.
    resolvedBranch = found.branch?.replace('refs/heads/', '') ?? null
    if (resolvedBranch !== branch) {
      const actual = resolvedBranch ?? '(detached HEAD)'
      console.error(
        `Worktree already exists at "${wtPath}" but is on "${actual}", not requested branch "${branch}". Use a different --as name or switch the existing worktree to the requested branch first.`,
      )
      process.exit(1)
    }
    isResume = true
    if (!opts.printPath) {
      console.log(`Worktree already exists: ${wtPath}`)
    }
  } else {
    // Resolve branch: local first, then origin/<branch>.
    const hasLocal = await branchExists(branch)
    if (!hasLocal) {
      let hasRemote: boolean
      try {
        hasRemote = await remoteBranchExists(branch)
      } catch (err) {
        const stderr =
          err && typeof err === 'object' && 'stderr' in err
            ? String(err.stderr).trim()
            : String(err)
        console.error(`Failed to check remote branch: ${stderr}`)
        process.exit(1)
      }
      if (!hasRemote) {
        console.error(
          `Branch "${branch}" not found locally or on origin. Fetch it first, or use "nn w <name>" to create a new branch.`,
        )
        process.exit(1)
      }
      try {
        await fetchBranch('origin', branch)
      } catch (err) {
        const stderr =
          err && typeof err === 'object' && 'stderr' in err
            ? String(err.stderr).trim()
            : String(err)
        console.error(`Failed to fetch branch: ${stderr}`)
        process.exit(1)
      }
    }

    await fs.mkdir(path.dirname(wtPath), { recursive: true })

    try {
      await addWorktreeExisting(wtPath, branch)
    } catch (err) {
      const stderr =
        err && typeof err === 'object' && 'stderr' in err
          ? String(err.stderr).trim()
          : String(err)
      console.error(`Failed to create worktree: ${stderr}`)
      process.exit(1)
    }
  }

  // On resume, read existing state so we can preserve createdAt/lastReviewId
  // and decide whether a PR lookup is still needed.
  const prevState = isResume ? await readState(wtPath) : null

  // Resolve PR number. Lookup runs for: fresh attach, explicit --pr, resume
  // with missing state, or resume where state.pr is null (so that re-attaching
  // can recover a PR number that wasn't persisted earlier).
  let prNumber: number | null = prevState?.pr ?? null
  if (opts.pr !== undefined) {
    prNumber = opts.pr
  } else if (!isResume || !prevState || prevState.pr == null) {
    const lookup = await getPrForBranch(branch)
    if (lookup.kind === 'found') {
      prNumber = lookup.pr
    } else if (!opts.printPath) {
      if (lookup.kind === 'unavailable') {
        console.log('note: PR lookup failed — skipping PR lookup')
      } else {
        console.log(`note: no open PR found for "${branch}"`)
      }
    }
  }

  if (!found) {
    // Fresh attach.
    const { root } = await getRepoInfo()
    const state: NNState = {
      name,
      branch: resolvedBranch ?? branch,
      repo: root,
      createdAt: new Date().toISOString(),
      pr: prNumber,
      lastReviewId: null,
    }
    await writeState(wtPath, state)

    if (!opts.printPath) {
      console.log(`Attached worktree: ${wtPath}`)
      console.log(`  branch: ${resolvedBranch ?? branch}`)
      if (prNumber !== null) console.log(`  PR:     #${prNumber}`)
    }
  } else if (!prevState) {
    // Resume with no state file — recreate it (e.g. worktree imported from
    // outside nn, or state file was deleted).
    const { root } = await getRepoInfo()
    const state: NNState = {
      name,
      branch: resolvedBranch ?? branch,
      repo: root,
      createdAt: new Date().toISOString(),
      pr: prNumber,
      lastReviewId: null,
    }
    await writeState(wtPath, state)

    if (!opts.printPath) {
      console.log(`Restored state: ${wtPath}`)
      if (prNumber !== null) console.log(`  PR:     #${prNumber}`)
    }
  } else if (prevState.pr !== prNumber) {
    // Resume: update state.pr if --pr was passed or a lookup discovered one.
    await writeState(wtPath, { ...prevState, pr: prNumber })
    if (!opts.printPath && prNumber !== null) {
      console.log(`Updated PR: #${prNumber}`)
    }
  }

  if (opts.printPath) {
    console.log(wtPath)
    return
  }

  console.log('Entering subshell... (exit to return)')
  console.log()

  const result = await enterSubshell(wtPath, name)

  await handleSubshellExit(name, wtPath, resolvedBranch, result)
}
