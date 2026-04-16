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
      '  nn w <name>              Create or resume a worktree',
      '  nn w ls [--json]         List all worktrees',
      '  nn w rm <name> [-f] [-y] Remove a worktree',
      '  nn w prune               Clean up stale worktree metadata',
      '',
      'Examples:',
      '  nn w planA               Create worktree with branch feat/planA',
      '  nn w planA --branch fix  Create worktree with branch fix',
      '  nn w planA --print-path  Print worktree path (for scripting)',
      '  nn w ls                  List all worktrees',
      '  nn w rm planA            Remove worktree and delete branch',
      '  nn w rm planA -f         Force remove (even if dirty)',
    ].join('\n'),
  )

const w = program
  .command('w')
  .alias('worktree')
  .description('Worktree management')
  .argument('[name]', 'worktree name (creates or resumes)')
  .option('--branch <branch>', 'branch name (default: feat/<name>)')
  .option('--print-path', 'print worktree path and exit')
  .action(async (name, opts) => {
    if (!name) return w.help()
    const { createCommand } = await import('./commands/worktree/create.js')
    await createCommand(name, opts)
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

program.parse()
