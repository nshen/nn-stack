import {
  deleteBranch,
  listWorktrees,
  pruneWorktrees,
} from '../../lib/git.js'
import { prompt } from '../../lib/prompt.js'

export async function pruneCommand() {
  const entries = await listWorktrees()
  const prunable = entries.filter((e) => e.prunable)

  if (prunable.length === 0) {
    console.log('No prunable worktrees.')
    return
  }

  console.log('Prunable worktrees:')
  for (const e of prunable) {
    const branch = e.branch?.replace('refs/heads/', '') ?? '(unknown)'
    console.log(`  - ${branch}    (${e.prunableReason ?? 'stale'})`)
  }
  console.log()

  const answer = await prompt('Prune? [y/N]: ')
  if (answer.toLowerCase() !== 'y') {
    console.log('Aborted.')
    return
  }

  await pruneWorktrees()
  console.log('Pruned.')

  // Check for orphan branches
  const orphanBranches = prunable
    .map((e) => e.branch?.replace('refs/heads/', ''))
    .filter(Boolean) as string[]

  if (orphanBranches.length > 0) {
    console.log()
    console.log('Orphan branches:')
    for (const b of orphanBranches) {
      console.log(`  - ${b}`)
    }
    console.log()

    const delAnswer = await prompt('Delete them too? [y/N]: ')
    if (delAnswer.toLowerCase() === 'y') {
      for (const b of orphanBranches) {
        try {
          await deleteBranch(b, false)
          console.log(`  Deleted branch ${b}`)
        } catch {
          const forceAnswer = await prompt(
            `  Branch ${b} has unmerged commits. Force delete? [y/N]: `,
          )
          if (forceAnswer.toLowerCase() === 'y') {
            try {
              await deleteBranch(b, true)
              console.log(`  Force-deleted branch ${b}`)
            } catch {
              console.log(`  Failed to delete branch ${b} (may be current branch)`)
            }
          } else {
            console.log(`  Skipped branch ${b}`)
          }
        }
      }
    }
  }
}
