import { spawn } from 'node:child_process'
import { showExitPrompt } from './worktree/_shared.js'
import { prepareWorktree } from './worktree/create.js'

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
  prompt: string,
): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn('claude', [prompt], {
      stdio: 'inherit',
      cwd,
      env: process.env,
    })
    child.on('exit', (code, signal) => resolve({ code, signal }))
    child.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
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
