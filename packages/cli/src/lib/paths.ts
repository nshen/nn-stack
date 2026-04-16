import path from 'node:path'
import { getRepoRoot } from './git.js'

export async function getRepoInfo() {
  const root = await getRepoRoot()
  return {
    root,
    parent: path.dirname(root),
    repoName: path.basename(root),
  }
}

export async function worktreeDirFor(name: string): Promise<string> {
  const { parent, repoName } = await getRepoInfo()
  return path.join(parent, `${repoName}-worktrees`, name)
}
