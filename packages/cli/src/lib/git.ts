import path from 'node:path'
import { $ } from 'zx'

$.verbose = false

export interface WorktreeEntry {
  path: string
  head: string
  branch: string | null
  isBare: boolean
  isDetached: boolean
  prunable: boolean
  prunableReason: string | null
}

export function parsePorcelain(raw: string): WorktreeEntry[] {
  const entries: WorktreeEntry[] = []
  const blocks = raw.trim().split('\n\n')

  for (const block of blocks) {
    if (!block.trim()) continue

    const lines = block.trim().split('\n')
    const entry: WorktreeEntry = {
      path: '',
      head: '',
      branch: null,
      isBare: false,
      isDetached: false,
      prunable: false,
      prunableReason: null,
    }

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        entry.path = line.slice('worktree '.length)
      } else if (line.startsWith('HEAD ')) {
        entry.head = line.slice('HEAD '.length)
      } else if (line.startsWith('branch ')) {
        entry.branch = line.slice('branch '.length)
      } else if (line === 'bare') {
        entry.isBare = true
      } else if (line === 'detached') {
        entry.isDetached = true
      } else if (line.startsWith('prunable ')) {
        entry.prunable = true
        entry.prunableReason = line.slice('prunable '.length)
      }
    }

    if (entry.path) entries.push(entry)
  }

  return entries
}

export async function listWorktrees(): Promise<WorktreeEntry[]> {
  const out = (await $`git worktree list --porcelain`).stdout
  return parsePorcelain(out)
}

export async function addWorktree(path: string, branch: string) {
  await $`git worktree add ${path} -b ${branch}`
}

export async function addWorktreeOrphan(path: string, branch: string) {
  await $({ quiet: true })`git worktree add --orphan -b ${branch} ${path}`
}

export async function addWorktreeExisting(path: string, branch: string) {
  await $`git worktree add ${path} ${branch}`
}

export async function removeWorktree(path: string, force: boolean) {
  if (force) await $`git worktree remove --force ${path}`
  else await $`git worktree remove ${path}`
}

export async function pruneWorktrees() {
  await $`git worktree prune`
}

export async function isDirty(cwd: string): Promise<boolean> {
  const out = (await $`git -C ${cwd} status --porcelain`).stdout
  return out.trim().length > 0
}

export async function aheadBehind(
  cwd: string,
): Promise<{ ahead: number; behind: number; hasUpstream: boolean }> {
  try {
    const out = (
      await $`git -C ${cwd} rev-list --left-right --count HEAD...@{upstream}`
    ).stdout.trim()
    const [ahead, behind] = out.split(/\s+/).map(Number)
    return { ahead: ahead || 0, behind: behind || 0, hasUpstream: true }
  } catch {
    return { ahead: 0, behind: 0, hasUpstream: false }
  }
}

export async function deleteBranch(name: string, force = false) {
  if (force) await $`git branch -D ${name}`
  else await $`git branch -d ${name}`
}

export async function branchExists(name: string): Promise<boolean> {
  const out = (await $`git branch --list ${name}`).stdout
  return out.trim().length > 0
}

export async function getRepoRoot(): Promise<string> {
  // git-common-dir points to the main repo's .git, even inside a worktree
  const gitCommonDir = (
    await $`git rev-parse --path-format=absolute --git-common-dir`
  ).stdout.trim()
  // .git dir is <repo>/.git, so parent is the repo root
  return path.dirname(gitCommonDir)
}

export async function hasCommits(): Promise<boolean> {
  try {
    await $`git rev-parse HEAD`
    return true
  } catch {
    return false
  }
}
