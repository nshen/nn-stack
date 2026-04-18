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
  // Only strip the prefix if the verbatim name doesn't resolve — this preserves
  // legitimate branches literally named "origin/foo".
  let branch = rawBranch
  if (rawBranch.startsWith('origin/')) {
    const literalLocal = await branchExists(rawBranch)
    const literalRemote = literalLocal
      ? false
      : await remoteBranchExists(rawBranch)
    if (!literalLocal && !literalRemote) {
      branch = rawBranch.slice('origin/'.length)
    }
  }
  const name = opts.as ?? branch
  assertValidName(name)

  const wtPath = await worktreeDirFor(name)
  const existing = await listWorktrees()
  const found = existing.find((e) => e.path === wtPath)

  let resolvedBranch: string | null = branch
  let isResume = false

  if (found) {
    // Worktree already exists — resume.
    isResume = true
    resolvedBranch = found.branch?.replace('refs/heads/', '') ?? null
    if (!opts.printPath) {
      console.log(`Worktree already exists: ${wtPath}`)
    }
  } else {
    // Resolve branch: local first, then origin/<branch>.
    const hasLocal = await branchExists(branch)
    if (!hasLocal) {
      const hasRemote = await remoteBranchExists(branch)
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

  // Resolve PR number.
  let prNumber: number | null = null
  if (!isResume || opts.pr !== undefined) {
    if (opts.pr !== undefined) {
      prNumber = opts.pr
    } else {
      const lookup = await getPrForBranch(branch)
      if (lookup.kind === 'found') {
        prNumber = lookup.pr
      } else if (!opts.printPath) {
        if (lookup.kind === 'unavailable') {
          console.log('note: gh not available — skipping PR lookup')
        } else {
          console.log(`note: no open PR found for "${branch}"`)
        }
      }
    }
  }

  if (!found) {
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
  } else if (opts.pr !== undefined) {
    // Resume with explicit --pr: update state.pr only.
    const prev = await readState(wtPath)
    if (prev) {
      await writeState(wtPath, { ...prev, pr: prNumber })
      if (!opts.printPath && prNumber !== null) {
        console.log(`Updated PR: #${prNumber}`)
      }
    } else if (!opts.printPath) {
      console.log(`note: state file missing — --pr ${prNumber} not persisted`)
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
