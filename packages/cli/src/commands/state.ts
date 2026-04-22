import fs from 'node:fs/promises'
import path from 'node:path'
import { getGitCommonDir, getGitDir } from '../lib/git.js'

async function stateFilePath(): Promise<string> {
  let gitDir: string
  try {
    gitDir = await getGitDir()
  } catch {
    console.error('not in a git repo')
    process.exit(1)
  }
  const commonDir = await getGitCommonDir()
  if (gitDir === commonDir) {
    console.error(
      'not in a linked worktree — nn-state.json only exists inside worktrees created by `nn w`',
    )
    process.exit(1)
  }
  return path.join(gitDir, 'nn-state.json')
}

const INTEGER_RE = /^-?\d+$/
const DECIMAL_RE = /^-?\d+\.\d+$/

async function readData(file: string): Promise<Record<string, unknown>> {
  let raw: string
  try {
    raw = await fs.readFile(file, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {}
    throw err
  }
  try {
    return JSON.parse(raw)
  } catch (err) {
    // Refuse to silently clobber a corrupt state file — the user would lose
    // whatever salvageable fields it contained on the next `set`.
    console.error(`Corrupt JSON in ${file}:`)
    console.error(`  ${err instanceof Error ? err.message : err}`)
    console.error('Fix or delete the file before re-running.')
    process.exit(1)
  }
}

async function writeDataAtomic(
  file: string,
  data: Record<string, unknown>,
) {
  // Per-PID tmp name avoids two concurrent writers clobbering the same tmp.
  // fsync the tmp fd before rename so a crash can't leave a half-written file.
  const tmp = `${file}.${process.pid}.tmp`
  const fh = await fs.open(tmp, 'w')
  try {
    await fh.writeFile(JSON.stringify(data, null, 2))
    await fh.sync()
  } finally {
    await fh.close()
  }
  await fs.rename(tmp, file)
}

export async function stateGetCommand(key: string) {
  const file = await stateFilePath()
  const data = await readData(file)
  const value = data[key]
  if (value === undefined || value === null) return
  console.log(typeof value === 'string' ? value : JSON.stringify(value))
}

export async function stateSetCommand(
  key: string,
  value: string,
  opts: { json?: boolean },
) {
  const file = await stateFilePath()
  const data = await readData(file)
  let parsed: unknown = value
  if (opts.json) {
    try {
      parsed = JSON.parse(value)
    } catch (err) {
      console.error(`invalid JSON for --json: ${err}`)
      process.exit(1)
    }
  } else if (INTEGER_RE.test(value)) {
    const n = Number(value)
    if (!Number.isSafeInteger(n)) {
      console.error(
        `Integer ${value} exceeds Number.MAX_SAFE_INTEGER; pass --json to store as a string.`,
      )
      process.exit(1)
    }
    parsed = n
  } else if (DECIMAL_RE.test(value)) {
    parsed = Number(value)
  }
  data[key] = parsed
  await writeDataAtomic(file, data)
}

export async function stateShowCommand(opts: { json?: boolean }) {
  const file = await stateFilePath()
  const data = await readData(file)
  if (opts.json) {
    console.log(JSON.stringify(data, null, 2))
    return
  }
  const keys = Object.keys(data)
  if (keys.length === 0) {
    console.log('(empty)')
    return
  }
  for (const k of keys) {
    const v = data[k]
    console.log(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
  }
}
