import { $ } from 'zx'

$.verbose = false

export async function findPanesUnder(targetPath: string): Promise<string[]> {
  try {
    const out = (
      await $`tmux list-panes -a -F ${'#{session_name}:#{window_index}.#{pane_index}\t#{pane_current_path}'}`
    ).stdout
    const prefix = targetPath.endsWith('/') ? targetPath : `${targetPath}/`
    return out
      .split('\n')
      .filter(Boolean)
      .filter((line) => {
        const [, cwd] = line.split('\t')
        return cwd === targetPath || (cwd && cwd.startsWith(prefix))
      })
      .map((line) => line.split('\t')[0])
  } catch {
    return []
  }
}
