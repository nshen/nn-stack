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

const VALID_NAME = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/

export function assertValidName(name: string) {
  const invalid =
    name === '.' ||
    name === '..' ||
    name.includes('\\') ||
    name.includes('//') ||
    name.endsWith('/') ||
    name.endsWith('.') ||
    !VALID_NAME.test(name)

  if (invalid) {
    console.error(
      `Invalid name "${name}": must start with a letter or number and contain only letters, numbers, ".", "_", "-", "/". Cannot end with "/" or ".", or contain "\\" or "//".`,
    )
    process.exit(1)
  }
}

export function deriveDirName(name: string): string {
  return name.replace(/\//g, '-')
}

export async function worktreeDirFor(name: string): Promise<string> {
  const { parent, repoName } = await getRepoInfo()
  return path.join(parent, `${repoName}-worktrees`, deriveDirName(name))
}
