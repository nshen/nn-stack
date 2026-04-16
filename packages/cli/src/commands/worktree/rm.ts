import {
  deleteBranch,
  isDirty,
  listWorktrees,
  removeWorktree,
} from '../../lib/git.js'
import { worktreeDirFor } from '../../lib/paths.js'
import { prompt } from '../../lib/prompt.js'
import { findPanesUnder } from '../../lib/tmux.js'

export async function rmCommand(
  name: string,
  opts: { force?: boolean; yes?: boolean; keepBranch?: boolean },
) {
  const expectedPath = await worktreeDirFor(name)
  const entries = await listWorktrees()
  const entry = entries.find((e) => e.path === expectedPath)

  if (!entry) {
    console.error(`Worktree "${name}" not found.`)
    process.exit(1)
  }

  const wtPath = entry.path
  const branch = entry.branch?.replace('refs/heads/', '') ?? null

  // Check dirty
  const dirty = await isDirty(wtPath)
  if (dirty && !opts.force) {
    console.error(`Worktree "${name}" has uncommitted changes.`)
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
    } catch {
      console.log(`Branch ${branch} could not be deleted (may have unmerged work, use -f to force)`)
    }
  }
}
