import { spawn } from 'node:child_process'
import { prompt } from '../lib/prompt.js'
import {
  BUNDLED_SKILLS,
  type SkillName,
  installSkill,
  skillDiscoverableAt,
} from '../lib/skills.js'
import { showExitPrompt } from './worktree/_shared.js'
import { prepareWorktree } from './worktree/create.js'

async function ensureSkillsInstalled() {
  const missing: SkillName[] = []
  for (const name of BUNDLED_SKILLS) {
    if (!(await skillDiscoverableAt(name))) missing.push(name)
  }
  if (missing.length === 0) return

  if (!process.stdin.isTTY) {
    console.error(`Skills not found: ${missing.join(', ')}`)
    console.error(
      "Can't prompt in a non-interactive shell. Run `nn skill install` first.",
    )
    process.exit(1)
  }

  console.log(`Skills not found: ${missing.join(', ')}`)
  console.log('Claude Code needs these to run /nn-dev.')
  console.log()
  console.log('  [g] Install globally  (~/.claude/commands/)   (default)')
  console.log('  [p] Install to this project  (.claude/commands/)')
  console.log('  [n] Abort')
  console.log()
  const choice = (await prompt('choice [g/p/n]: ')).toLowerCase().trim()

  if (choice === 'n') {
    console.error('Aborted. Install manually with `nn skill install`.')
    process.exit(1)
  }
  const scope = choice === 'p' ? 'project' : 'global'

  for (const name of missing) {
    const result = await installSkill(name, scope)
    console.log(`  ✓ ${result}: ${name} (${scope})`)
  }
  console.log()
}

/**
 * `nn dev <name> [plan...]`
 * Create or resume a worktree, then launch Claude with `/nn-dev <plan>`
 * inside it. On exit, run the same keep/delete prompt `nn w` uses.
 */
export async function devCommand(
  name: string,
  planArgs: string[],
  opts: { branch?: string },
) {
  await ensureSkillsInstalled()

  const {
    path: wtPath,
    branch,
    created,
  } = await prepareWorktree(name, opts)

  if (created) {
    console.log(`Created worktree: ${wtPath}`)
    console.log(`  branch: ${branch}`)
  } else {
    console.log(`Resuming worktree: ${wtPath}`)
  }

  const plan = planArgs.join(' ').trim()
  const initialPrompt = plan ? `/nn-dev ${plan}` : '/nn-dev'

  console.log(`Launching Claude with: ${initialPrompt}`)
  console.log()

  const result = await runClaude(wtPath, initialPrompt)

  if (result.signal) {
    console.log()
    console.log(`Warning: Claude exited abnormally (${result.signal})`)
    console.log('Worktree preserved. Resume with:')
    console.log(`  nn dev ${name}`)
    return
  }

  if (result.code !== null && result.code !== 0) {
    console.log()
    console.log(`Warning: Claude exited with code ${result.code}`)
    console.log('Worktree preserved. Resume with:')
    console.log(`  nn dev ${name}`)
    return
  }

  await showExitPrompt(name, wtPath, branch)
}

function runClaude(
  cwd: string,
  initialPrompt: string,
): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn('claude', [initialPrompt], {
      stdio: 'inherit',
      cwd,
      env: process.env,
    })
    child.on('exit', (code, signal) => resolve({ code, signal }))
    child.on('error', (err) => {
      const code = (err as NodeJS.ErrnoException).code
      if (code === 'ENOENT') {
        console.error('`claude` not found on PATH.')
        console.error(
          'Install Claude Code first: https://claude.com/claude-code',
        )
        process.exit(1)
      }
      reject(err)
    })
  })
}
