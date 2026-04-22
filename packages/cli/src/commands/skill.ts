import {
  BUNDLED_SKILLS,
  type SkillName,
  allSkillStatuses,
  globalSkillsDir,
  installSkill,
  projectSkillsDir,
  skillStatus,
  uninstallSkill,
} from '../lib/skills.js'

export async function skillInstallCommand(opts: {
  project?: boolean
  force?: boolean
}) {
  const scope = opts.project ? 'project' : 'global'
  const targetDir =
    scope === 'global' ? globalSkillsDir() : await projectSkillsDir()
  console.log(`Installing skills to: ${targetDir}`)
  console.log()

  for (const name of BUNDLED_SKILLS) {
    const result = await installSkill(name, scope, { force: opts.force })
    console.log(`  ${formatResult(result)}  ${name}`)
  }

  console.log()
  console.log(
    'Tip: re-run with --force to overwrite skills that were modified locally.',
  )
}

export async function skillUninstallCommand(opts: { project?: boolean }) {
  const scope = opts.project ? 'project' : 'global'
  for (const name of BUNDLED_SKILLS) {
    const result = await uninstallSkill(name, scope)
    console.log(`  ${result === 'removed' ? '✓ removed' : '— not installed'}  ${name}`)
  }
}

export async function skillStatusCommand(opts: { json?: boolean }) {
  const statuses = await allSkillStatuses()

  if (opts.json) {
    console.log(
      JSON.stringify(
        statuses.map((s) => ({
          name: s.name,
          global: describe(s.bundledHash, s.globalHash),
          project: describe(s.bundledHash, s.projectHash),
          globalPath: s.globalPath,
          projectPath: s.projectPath,
        })),
        null,
        2,
      ),
    )
    return
  }

  for (const s of statuses) {
    console.log(s.name)
    console.log(`  global:  ${describe(s.bundledHash, s.globalHash)}  ${s.globalPath}`)
    console.log(`  project: ${describe(s.bundledHash, s.projectHash)}  ${s.projectPath}`)
  }
}

function describe(bundled: string, current: string | null): string {
  if (current === null) return 'not installed'
  if (current === bundled) return 'up to date'
  return 'modified (local version differs from bundled)'
}

function formatResult(result: Awaited<ReturnType<typeof installSkill>>) {
  switch (result) {
    case 'installed':
      return '✓ installed'
    case 'updated':
      return '✓ updated'
    case 'skipped-same':
      return '— up to date'
    case 'skipped-modified':
      return '! modified locally (use --force to overwrite)'
  }
}

export async function skillListCommand() {
  console.log('Bundled skills:')
  for (const name of BUNDLED_SKILLS) {
    const s = await skillStatus(name as SkillName)
    console.log(`  ${name}  (sha256: ${s.bundledHash.slice(0, 12)})`)
  }
}
