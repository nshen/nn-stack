import path from 'node:path'
import {
  aheadBehind,
  deleteBranch,
  isDirty,
  listWorktrees,
  removeWorktree,
} from '../../lib/git.js'
import { prompt } from '../../lib/prompt.js'
import { findPanesUnder } from '../../lib/tmux.js'

export async function rmCommand(
  name: string,
  opts: { force?: boolean; yes?: boolean; keepBranch?: boolean },
) {
  const entries = await listWorktrees()
  // Match by basename of path — same rule `ls` uses for the NAME column.
  // Skip index 0 (the main worktree) so `rm` never targets it.
  const entry = entries
    .slice(1)
    .find((e) => path.basename(e.path) === name)

  if (!entry) {
    console.error(`Worktree "${name}" not found.`)
    process.exit(1)
  }

  const wtPath = entry.path
  const branch = entry.branch?.replace('refs/heads/', '') ?? null

  // Check if current directory is inside the worktree
  const cwd = process.cwd()
  if (cwd === wtPath || cwd.startsWith(`${wtPath}/`)) {
    console.error(`Cannot remove worktree "${name}": you are currently inside it.`)
    console.error(`Run "exit" first to leave the worktree, then remove it.`)
    process.exit(1)
  }

  // Check dirty
  const dirty = await isDirty(wtPath)
  if (dirty && !opts.force) {
    console.error(`Worktree "${name}" has uncommitted changes.`)
    console.error('Use -f/--force to delete anyway.')
    process.exit(1)
  }

  // Check unpushed commits
  const { ahead, hasUpstream } = await aheadBehind(wtPath)
  if ((!hasUpstream || ahead > 0) && !opts.force) {
    const reason = !hasUpstream
      ? 'has no upstream (never pushed)'
      : `has ${ahead} unpushed commits`
    console.error(`Worktree "${name}" ${reason}.`)
    console.error('Use -f/--force to delete anyway.')
    process.exit(1)
  }

  // Check tmux panes
  const panes = await findPanesUnder(wtPath)
  if (panes.length > 0 && !opts.force) {
    console.error(`Worktree "${name}" is open in tmux pane(s):`)
    for (const p of panes) {
      console.error(`  ${p}`)
    }
    console.error('Use -f/--force to delete anyway.')
    process.exit(1)
  }

  // Confirm
  if (!opts.yes) {
    console.log('Remove worktree:')
    console.log(`  path:   ${wtPath}`)
    if (branch) {
      const branchAction = opts.keepBranch
        ? '(will be kept)'
        : '(will be deleted, pass --keep-branch to keep)'
      console.log(`  branch: ${branch} ${branchAction}`)
    }
    console.log(`  dirty:  ${dirty ? 'yes' : 'no'}`)
    if (hasUpstream) {
      console.log(`  ahead:  ${ahead > 0 ? `${ahead} unpushed` : '0'}`)
    } else {
      console.log('  ahead:  no upstream')
    }
    console.log()

    const answer = await prompt('Proceed? [y/N]: ')
    if (answer.toLowerCase() !== 'y') {
      console.log('Aborted.')
      return
    }
  }

  // Remove worktree
  await removeWorktree(wtPath, !!opts.force)
  console.log(`Removed worktree: ${wtPath}`)

  // Delete branch
  if (branch && !opts.keepBranch) {
    try {
      await deleteBranch(branch, !!opts.force)
      console.log(`Deleted branch: ${branch}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const hint = opts.force
        ? ''
        : ', use -f to force'
      console.log(`Branch ${branch} could not be deleted (${msg}${hint})`)
    }
  }
}
