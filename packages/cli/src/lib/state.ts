import fs from 'node:fs/promises'
import path from 'node:path'

export interface NNState {
  name: string
  branch: string
  repo: string
  createdAt: string
  pr: number | null
  lastReviewId: number | null
}

async function getGitDir(worktreePath: string): Promise<string> {
  const dotGitPath = path.join(worktreePath, '.git')
  const stat = await fs.stat(dotGitPath)
  if (stat.isDirectory()) {
    throw new Error(`Not a linked worktree (main repo): ${worktreePath}`)
  }
  const dotGit = await fs.readFile(dotGitPath, 'utf8')
  const match = dotGit.match(/^gitdir:\s*(.+)$/m)
  if (!match) throw new Error(`Not a git worktree: ${worktreePath}`)
  const gitDir = match[1].trim()
  return path.isAbsolute(gitDir)
    ? gitDir
    : path.resolve(path.dirname(dotGitPath), gitDir)
}

export async function writeState(worktreePath: string, state: NNState) {
  const dir = await getGitDir(worktreePath)
  await fs.writeFile(
    path.join(dir, 'nn-state.json'),
    JSON.stringify(state, null, 2),
  )
}

export async function readState(
  worktreePath: string,
): Promise<NNState | null> {
  try {
    const dir = await getGitDir(worktreePath)
    const raw = await fs.readFile(path.join(dir, 'nn-state.json'), 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}
