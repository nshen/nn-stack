import { $ } from 'zx'

$.verbose = false

export type PrLookup =
  | { kind: 'found'; pr: number }
  | { kind: 'none' }
  | { kind: 'unavailable' }

export async function getPrForBranch(branch: string): Promise<PrLookup> {
  try {
    const out = (
      await $`gh pr list --head ${branch} --state open --json number --jq ${'.[0].number'}`
    ).stdout.trim()
    if (!out) return { kind: 'none' }
    const n = Number(out)
    return Number.isFinite(n) && n > 0
      ? { kind: 'found', pr: n }
      : { kind: 'none' }
  } catch {
    return { kind: 'unavailable' }
  }
}
