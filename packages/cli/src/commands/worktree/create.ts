import fs from 'node:fs/promises'
import path from 'node:path'
import {
  addWorktree,
  addWorktreeExisting,
  addWorktreeOrphan,
  aheadBehind,
  branchExists,
  deleteBranch,
  hasCommits,
  isDirty,
  listWorktrees,
  removeWorktree,
} from '../../lib/git.js'
import { getRepoInfo, worktreeDirFor } from '../../lib/paths.js'
import { prompt } from '../../lib/prompt.js'
import { type NNState, readState, writeState } from '../../lib/state.js'
import { enterSubshell } from '../../lib/subshell.js'

const VALID_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

function assertValidName(name: string) {
  if (
    name === '.' ||
    name === '..' ||
    name.includes('/') ||
    name.includes('\\') ||
    !VALID_NAME.test(name)
  ) {
    console.error(
      `Invalid worktree name "${name}": must contain only letters, numbers, ".", "_" or "-", and must not be "." or "..".`,
    )
    process.exit(1)
  }
}

export async function createCommand(
  name: string,
  opts: { branch?: string; printPath?: boolean },
) {
  assertValidName(name)

  const emptyRepo = !(await hasCommits())
  const wtPath = await worktreeDirFor(name)
  let branchName: string | null = opts.branch ?? `feat/${name}`

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

  // Handle exit
  if (result.signal) {
    console.log()
    console.log(`Warning: Subshell exited abnormally (${result.signal})`)
    console.log('Worktree preserved. Resume with:')
    console.log(`  nn w ${name}`)
    return
  }

  if (result.code !== null && result.code !== 0) {
    console.log()
    console.log(`Warning: Subshell exited abnormally (code ${result.code})`)
    console.log('Worktree preserved. Resume with:')
    console.log(`  nn w ${name}`)
    return
  }

  // Normal exit — show status and prompt
  await showExitPrompt(name, wtPath, branchName)
}

async function showExitPrompt(
  name: string,
  wtPath: string,
  branchName: string | null,
) {
  const dirty = await isDirty(wtPath)
  const { ahead, hasUpstream } = await aheadBehind(wtPath)
  const state = await readState(wtPath)
  const pr = state?.pr ? `#${state.pr}` : 'not created'

  const aheadText = !hasUpstream
    ? 'no upstream (not pushed)'
    : ahead > 0
      ? `${ahead} commits unpushed`
      : '0'

  console.log()
  console.log(`── Worktree: ${name} ────────────────────────`)
  console.log(`  branch:  ${branchName ?? '(detached)'}`)
  console.log(`  dirty:   ${dirty ? 'yes' : 'no'}`)
  console.log(`  ahead:   ${aheadText}`)
  console.log(`  PR:      ${pr}`)
  console.log('───────────────────────────────────────────')
  console.log()
  console.log('  [k] Keep (default)')
  console.log(`  [d] Delete worktree${branchName ? ' + branch' : ''}`)
  console.log()

  const choice = await prompt('choice [k/d]: ')

  if (choice.toLowerCase() !== 'd') {
    console.log('Kept.')
    return
  }

  // Safety check for dirty, unpushed, or no upstream
  if (dirty || ahead > 0 || !hasUpstream) {
    const warnings: string[] = []
    if (dirty) warnings.push('uncommitted changes')
    if (!hasUpstream) warnings.push('branch has no upstream (never pushed)')
    else if (ahead > 0) warnings.push(`${ahead} unpushed commits`)

    console.log()
    console.log(`Warning: You have ${warnings.join(' and ')}.`)
    const confirm = await prompt("Type 'yes' to confirm deletion: ")
    if (confirm !== 'yes') {
      console.log('Kept.')
      return
    }
  }

  // Delete worktree
  try {
    await removeWorktree(wtPath, true)
    console.log(`Removed worktree: ${wtPath}`)
  } catch (err) {
    console.error(`Failed to remove worktree: ${err}`)
    return
  }

  // Delete branch (skip if detached)
  if (branchName) {
    try {
      await deleteBranch(branchName, false)
      console.log(`Deleted branch: ${branchName}`)
    } catch {
      try {
        await deleteBranch(branchName, true)
        console.log(`Force-deleted branch: ${branchName} (had unmerged commits)`)
      } catch {
        console.log(`Branch ${branchName} could not be deleted`)
      }
    }
  }
}
