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

async function readData(file: string): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'))
  } catch {
    return {}
  }
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
  } else if (value !== '' && !Number.isNaN(Number(value))) {
    parsed = Number(value)
  }
  data[key] = parsed
  await fs.writeFile(file, JSON.stringify(data, null, 2))
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
