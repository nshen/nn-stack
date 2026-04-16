import path from 'node:path'
import { table } from '../../lib/format.js'
import { listWorktrees } from '../../lib/git.js'

export async function lsCommand(opts: { json?: boolean }) {
  const entries = await listWorktrees()

  if (opts.json) {
    const data = entries.map((e, i) => ({
      name: i === 0 ? '(main)' : path.basename(e.path),
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
  const rows = entries.map((e, i) => {
    const branch = e.branch?.replace('refs/heads/', '') ?? '(detached)'
    const isMain = i === 0
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
