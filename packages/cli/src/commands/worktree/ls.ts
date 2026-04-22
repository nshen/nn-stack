import path from 'node:path'
import { table } from '../../lib/format.js'
import { getRepoRoot, listWorktrees } from '../../lib/git.js'

export async function lsCommand(opts: { json?: boolean }) {
  const [entries, root] = await Promise.all([listWorktrees(), getRepoRoot()])

  if (opts.json) {
    const data = entries.map((e) => ({
      name: e.path === root ? '(main)' : path.basename(e.path),
      branch: e.branch?.replace('refs/heads/', '') ?? null,
      path: e.path,
      bare: e.isBare,
      detached: e.isDetached,
      prunable: e.prunable,
      prunableReason: e.prunableReason,
    }))
    console.log(JSON.stringify(data, null, 2))
    return
  }

  const headers = ['NAME', 'BRANCH', 'PATH', 'STATUS']
  const rows = entries.map((e) => {
    const branch = e.branch?.replace('refs/heads/', '') ?? '(detached)'
    const isMain = e.path === root
    const name = e.prunable
      ? '(orphan)'
      : isMain
        ? '(main)'
        : path.basename(e.path)
    const displayPath = e.prunable ? '(prunable)' : e.path
    const status = e.prunable
      ? 'prunable'
      : e.isDetached
        ? 'detached'
        : '-'

    return [name, branch, displayPath, status]
  })

  console.log(table(headers, rows))
}
