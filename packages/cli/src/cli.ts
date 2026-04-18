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
      'Worktree commands:',
      '  nn w <name>                 Create or resume a worktree',
      '  nn w attach <branch>        Attach worktree to an existing branch + PR',
      '  nn w ls [--json]            List all worktrees',
      '  nn w rm <name> [-f] [-y]    Remove a worktree',
      '  nn w prune                  Clean up stale worktree metadata',
      '',
      'Examples:',
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

program.parseAsync().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
