import { Command } from 'commander'

const program = new Command()
program
  .name('nn')
  .version('0.1.0', '-v, --version')
  .description('nn-stack cli')
  .addHelpText(
    'after',
    [
      '',
      'Dev workflow:',
      '  nn dev <name> [plan]     Create worktree + launch Claude /nn-dev',
      '',
      'Worktree commands:',
      '  nn w <name>                 Create or resume a worktree',
      '  nn w attach <branch>        Attach worktree to an existing branch + PR',
      '  nn w ls [--json]            List all worktrees',
      '  nn w rm <name> [-f] [-y]    Remove a worktree',
      '  nn w prune                  Clean up stale worktree metadata',
      '  nn w current [--json]       Show info about the current worktree',
      '',
      'State commands (inside a worktree):',
      '  nn state get <key>          Read a key from nn-state.json',
      '  nn state set <key> <val>    Write a key to nn-state.json',
      '  nn state show [--json]      Show all keys',
      '',
      'Examples:',
      '  nn dev planA plan.md             One-shot: worktree + Claude /nn-dev',
      '  nn dev planA                     Resume a worktree and re-enter /nn-dev',
      '  nn w planA                       Create worktree with branch planA',
      '  nn w feat/planA                  Branch feat/planA, directory feat-planA',
      '  nn w planA --branch fix          Create worktree with branch fix',
      '  nn w planA --print-path          Print worktree path (for scripting)',
      '  nn w attach feat/add-export      Attach to existing branch + open PR',
      '  nn w attach feat/x --as work     Use custom worktree directory name',
      '  nn w attach feat/x --pr 123      Force PR number (skip gh lookup)',
      '  nn w ls                          List all worktrees',
      '  nn w rm planA                    Remove worktree and delete branch',
      '  nn w rm planA -f                 Force remove (even if dirty)',
      '  nn state get pr                  Print current PR number',
      '  nn state set pr 123              Store PR number',
    ].join('\n'),
  )

const w = program
  .command('w')
  .alias('worktree')
  .description('Worktree management')
  .argument('[name]', 'worktree name (creates or resumes)')
  .option('--branch <branch>', 'branch name (default: <name>)')
  .option('--print-path', 'print worktree path and exit')
  .action(async (name, opts) => {
    if (!name) return w.help()
    const { createCommand } = await import('./commands/worktree/create.js')
    await createCommand(name, opts)
  })

w.command('attach')
  .description('Attach a worktree to an existing branch (and its PR)')
  .argument(
    '<branch>',
    'existing branch name (tried locally first, then on origin)',
  )
  .option('--as <name>', 'worktree directory name (default: derived from branch)')
  .option('--pr <n>', 'PR number (skips gh lookup)', (v) => {
    const n = Number(v)
    if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
      console.error(`Invalid --pr value: "${v}" (expected positive integer)`)
      process.exit(1)
    }
    return n
  })
  .option('--print-path', 'print worktree path and exit')
  .action(async (branch, opts) => {
    const { attachCommand } = await import('./commands/worktree/attach.js')
    await attachCommand(branch, opts)
  })

w.command('ls')
  .description('List all worktrees')
  .option('--json', 'JSON output')
  .action(async (opts) => {
    const { lsCommand } = await import('./commands/worktree/ls.js')
    await lsCommand(opts)
  })

w.command('rm')
  .description('Remove a worktree')
  .argument('<name>', 'worktree name')
  .option('-f, --force', 'force delete even if dirty')
  .option('-y, --yes', 'skip confirmation')
  .option('--keep-branch', 'keep the branch after removing worktree')
  .action(async (name, opts) => {
    const { rmCommand } = await import('./commands/worktree/rm.js')
    await rmCommand(name, opts)
  })

w.command('prune')
  .description('Clean up stale worktree metadata')
  .action(async () => {
    const { pruneCommand } = await import('./commands/worktree/prune.js')
    await pruneCommand()
  })

w.command('current')
  .description('Show info about the current worktree')
  .option('--json', 'JSON output')
  .action(async (opts) => {
    const { currentCommand } = await import('./commands/worktree/current.js')
    await currentCommand(opts)
  })

const state = program
  .command('state')
  .description('Read/write keys in the current worktree nn-state.json')

state
  .command('get')
  .description('Read a key from nn-state.json')
  .argument('<key>', 'key name (e.g. pr, lastReviewId)')
  .action(async (key) => {
    const { stateGetCommand } = await import('./commands/state.js')
    await stateGetCommand(key)
  })

state
  .command('set')
  .description('Write a key to nn-state.json')
  .argument('<key>', 'key name')
  .argument('<value>', 'value (numeric strings become numbers)')
  .option('--json', 'parse value as JSON (for arrays/objects/booleans)')
  .action(async (key, value, opts) => {
    const { stateSetCommand } = await import('./commands/state.js')
    await stateSetCommand(key, value, opts)
  })

state
  .command('show')
  .description('Show all keys in nn-state.json')
  .option('--json', 'JSON output')
  .action(async (opts) => {
    const { stateShowCommand } = await import('./commands/state.js')
    await stateShowCommand(opts)
  })

program
  .command('dev')
  .description('Create worktree + launch Claude with /nn-dev')
  .argument('<name>', 'worktree name (creates or resumes)')
  .argument('[plan...]', 'plan text or .md path; forwarded to /nn-dev')
  .option('--branch <branch>', 'branch name (default: <name>)')
  .action(async (name, plan, opts) => {
    const { devCommand } = await import('./commands/dev.js')
    await devCommand(name, plan, opts)
  })

program.parseAsync().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exitCode = 1
})
