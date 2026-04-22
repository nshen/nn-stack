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

export interface PreparedWorktree {
  path: string
  branch: string | null
  created: boolean
}

/**
 * Create the named worktree (resume if it already exists). Returns the
 * on-disk path and resolved branch. Caller decides what to do next
 * (subshell, launch a tool, print the path, …).
 */
export async function prepareWorktree(
  name: string,
  opts: { branch?: string } = {},
): Promise<PreparedWorktree> {
  assertValidName(name)

  const emptyRepo = !(await hasCommits())
  const wtPath = await worktreeDirFor(name)
  const branchName: string = opts.branch ?? name

  const existing = await listWorktrees()
  const found = existing.find((e) => e.path === wtPath)

  if (found) {
    return {
      path: wtPath,
      branch: found.branch?.replace('refs/heads/', '') ?? null,
      created: false,
    }
  }

  await fs.mkdir(path.dirname(wtPath), { recursive: true })

  try {
    if (emptyRepo) {
      try {
        await addWorktreeOrphan(wtPath, branchName)
      } catch {
        console.error('Cannot create worktree: repository has no commits.')
        console.error(
          'Make an initial commit first, or upgrade to git 2.42+ for orphan worktree support.',
        )
        process.exit(1)
      }
    } else {
      const exists = await branchExists(branchName)
      if (exists) await addWorktreeExisting(wtPath, branchName)
      else await addWorktree(wtPath, branchName)
    }
  } catch (err) {
    const stderr =
      err && typeof err === 'object' && 'stderr' in err
        ? String(err.stderr).trim()
        : String(err)
    console.error(`Failed to create worktree: ${stderr}`)
    process.exit(1)
  }

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

  return { path: wtPath, branch: branchName, created: true }
}

export async function createCommand(
  name: string,
  opts: { branch?: string; printPath?: boolean },
) {
  const { path: wtPath, branch, created } = await prepareWorktree(name, opts)

  if (!opts.printPath) {
    if (created) {
      console.log(`Created worktree: ${wtPath}`)
      console.log(`  branch: ${branch}`)
    } else {
      console.log(`Worktree already exists: ${wtPath}`)
    }
  }

  if (opts.printPath) {
    console.log(wtPath)
    return
  }

  console.log('Entering subshell... (exit to return)')
  console.log()

  const result = await enterSubshell(wtPath, name)
  await handleSubshellExit(name, wtPath, branch, result)
}
