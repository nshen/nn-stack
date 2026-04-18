import {
  aheadBehind,
  deleteBranch,
  isDirty,
  removeWorktree,
} from '../../lib/git.js'
import { prompt } from '../../lib/prompt.js'
import { readState } from '../../lib/state.js'

export async function showExitPrompt(
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

  try {
    await removeWorktree(wtPath, true)
    console.log(`Removed worktree: ${wtPath}`)
  } catch (err) {
    console.error(`Failed to remove worktree: ${err}`)
    return
  }

  if (branchName) {
    try {
      await deleteBranch(branchName, false)
      console.log(`Deleted branch: ${branchName}`)
    } catch {
      try {
        await deleteBranch(branchName, true)
        console.log(
          `Force-deleted branch: ${branchName} (had unmerged commits)`,
        )
      } catch {
        console.log(`Branch ${branchName} could not be deleted`)
      }
    }
  }
}

export async function handleSubshellExit(
  name: string,
  wtPath: string,
  branchName: string | null,
  result: { code: number | null; signal: NodeJS.Signals | null },
) {
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

  await showExitPrompt(name, wtPath, branchName)
}
