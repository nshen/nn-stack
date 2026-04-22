import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRepoRoot } from './git.js'

export const BUNDLED_SKILLS = [
  'nn-dev',
  'nn-code-review',
  'nn-pr-comments',
] as const

export type SkillName = (typeof BUNDLED_SKILLS)[number]

/**
 * The skills/ directory shipped with the npm package.
 * dist/cli.js → ../skills in both dev and installed layouts.
 */
export function bundledSkillsDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url))
  return path.resolve(here, '..', 'skills')
}

export function globalSkillsDir(): string {
  return path.join(os.homedir(), '.claude', 'commands')
}

/**
 * Project-scope skills dir, or null when not inside a git repo.
 * Callers that require this (e.g. `--project` install) should error with
 * a specific message; callers that merely display status should treat
 * null as "not applicable".
 */
export async function projectSkillsDir(): Promise<string | null> {
  try {
    return path.join(await getRepoRoot(), '.claude', 'commands')
  } catch {
    return null
  }
}

async function sha256File(file: string): Promise<string | null> {
  try {
    const buf = await fs.readFile(file)
    return createHash('sha256').update(buf).digest('hex')
  } catch {
    return null
  }
}

export interface SkillStatus {
  name: SkillName
  bundledHash: string
  globalPath: string
  globalHash: string | null
  projectPath: string | null
  projectHash: string | null
}

export async function skillStatus(
  name: SkillName,
): Promise<SkillStatus> {
  const bundled = path.join(bundledSkillsDir(), `${name}.md`)
  const globalPath = path.join(globalSkillsDir(), `${name}.md`)
  const projectDir = await projectSkillsDir()
  const projectPath = projectDir
    ? path.join(projectDir, `${name}.md`)
    : null
  const [bundledHash, globalHash, projectHash] = await Promise.all([
    sha256File(bundled),
    sha256File(globalPath),
    projectPath ? sha256File(projectPath) : Promise.resolve(null),
  ])
  if (!bundledHash) {
    throw new Error(`bundled skill missing: ${bundled}`)
  }
  return {
    name,
    bundledHash,
    globalPath,
    globalHash,
    projectPath,
    projectHash,
  }
}

export async function allSkillStatuses(): Promise<SkillStatus[]> {
  return Promise.all(BUNDLED_SKILLS.map(skillStatus))
}

function requireProjectPath(status: SkillStatus): string {
  if (!status.projectPath) {
    console.error('--project requires a git repo.')
    process.exit(1)
  }
  return status.projectPath
}

export async function installSkill(
  name: SkillName,
  scope: 'global' | 'project',
  opts: { force?: boolean } = {},
): Promise<'installed' | 'updated' | 'skipped-same' | 'skipped-modified'> {
  const status = await skillStatus(name)
  const target =
    scope === 'global' ? status.globalPath : requireProjectPath(status)
  const current = scope === 'global' ? status.globalHash : status.projectHash

  if (current === status.bundledHash) return 'skipped-same'
  if (current && !opts.force) return 'skipped-modified'

  await fs.mkdir(path.dirname(target), { recursive: true })
  const src = path.join(bundledSkillsDir(), `${name}.md`)
  await fs.copyFile(src, target)
  return current ? 'updated' : 'installed'
}

export async function uninstallSkill(
  name: SkillName,
  scope: 'global' | 'project',
): Promise<'removed' | 'not-installed'> {
  const status = await skillStatus(name)
  const target =
    scope === 'global' ? status.globalPath : requireProjectPath(status)
  try {
    await fs.unlink(target)
    return 'removed'
  } catch {
    return 'not-installed'
  }
}

/**
 * Is this skill discoverable by Claude Code in at least one place?
 * Returns the first location found, or null.
 */
export async function skillDiscoverableAt(
  name: SkillName,
): Promise<'global' | 'project' | null> {
  const status = await skillStatus(name)
  if (status.globalHash) return 'global'
  if (status.projectHash) return 'project'
  return null
}
