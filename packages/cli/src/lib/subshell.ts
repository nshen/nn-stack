import { spawn } from 'node:child_process'

export async function enterSubshell(
  cwd: string,
  worktreeName: string,
): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  const shell =
    process.env.SHELL ||
    (process.platform === 'win32'
      ? process.env.ComSpec || 'cmd.exe'
      : '/bin/sh')

  return new Promise((resolve, reject) => {
    const child = spawn(shell, [], {
      stdio: 'inherit',
      cwd,
      env: { ...process.env, NN_WORKTREE: worktreeName },
    })
    child.on('exit', (code, signal) => resolve({ code, signal }))
    child.on('error', (err) => reject(err))
  })
}
