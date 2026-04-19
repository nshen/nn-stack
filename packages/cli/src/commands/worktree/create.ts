import fs from 'node:fs/promises'
import path from 'node:path'
import {
  addWorktree,
  addWorktreeExisting,
  addWorktreeOrphan,
  branchExists,
  hasCommits,
  listWorktrees,
} from '../../lib/git.js'
import {
  assertValidName,
  getRepoInfo,
  worktreeDirFor,
} from '../../lib/paths.js'
import { type NNState, writeState } from '../../lib/state.js'
import { enterSubshell } from '../../lib/subshell.js'
import { handleSubshellExit } from './_shared.js'

export async function createCommand(
  name: string,
  opts: { branch?: string; printPath?: boolean },
) {
  assertValidName(name)

  const emptyRepo = !(await hasCommits())
  const wtPath = await worktreeDirFor(name)
  let branchName: string | null = opts.branch ?? name

  // Check if worktree already exists
  const existing = await listWorktrees()
  const found = existing.find((e) => e.path === wtPath)

  if (!found) {
    // Ensure parent directory exists
    await fs.mkdir(path.dirname(wtPath), { recursive: true })

    // Create new worktree
    try {
      if (emptyRepo) {
        // Try --orphan first (git 2.42+), fallback to clear error
        try {
          await addWorktreeOrphan(wtPath, branchName)
        } catch {
          console.error(
            'Cannot create worktree: repository has no commits.',
          )
          console.error(
            'Make an initial commit first, or upgrade to git 2.42+ for orphan worktree support.',
          )
          process.exit(1)
        }
      } else {
        const exists = await branchExists(branchName)
        if (exists) {
          await addWorktreeExisting(wtPath, branchName)
        } else {
          await addWorktree(wtPath, branchName)
        }
      }
    } catch (err) {
      const stderr =
        err && typeof err === 'object' && 'stderr' in err
          ? String(err.stderr).trim()
          : String(err)
      console.error(`Failed to create worktree: ${stderr}`)
      process.exit(1)
    }

    // Write state
    const { root } = await getRepoInfo()
    const state: NNState = {
      name,
      branch: branchName,
      repo: root,
      createdAt: new Date().toISOString(),
      pr: null,
      lastReviewId: null,
    }
    await writeState(wtPath, state)

    if (!opts.printPath) {
      console.log(`Created worktree: ${wtPath}`)
      console.log(`  branch: ${branchName}`)
    }
  } else {
    // Resume — use actual branch from existing worktree (null if detached)
    branchName = found.branch?.replace('refs/heads/', '') ?? null
    if (!opts.printPath) {
      console.log(`Worktree already exists: ${wtPath}`)
    }
  }

  // --print-path: output only the path to stdout (machine-readable)
  if (opts.printPath) {
    console.log(wtPath)
    return
  }

  // Enter subshell
  console.log('Entering subshell... (exit to return)')
  console.log()

  const result = await enterSubshell(wtPath, name)

  await handleSubshellExit(name, wtPath, branchName, result)
}
