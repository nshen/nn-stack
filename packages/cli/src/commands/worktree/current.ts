import path from 'node:path'
import {
  getCurrentBranch,
  getGitCommonDir,
  getGitDir,
  getRemoteUrl,
  getTopLevel,
  parseOwnerRepo,
} from '../../lib/git.js'

interface CurrentInfo {
  inGitRepo: boolean
  isLinked: boolean
  path: string | null
  name: string | null
  branch: string | null
  gitDir: string | null
  owner: string | null
  repo: string | null
}

export async function currentCommand(opts: { json?: boolean }) {
  let gitDir: string
  try {
    gitDir = await getGitDir()
  } catch {
    const info: CurrentInfo = {
      inGitRepo: false,
      isLinked: false,
      path: null,
      name: null,
      branch: null,
      gitDir: null,
      owner: null,
      repo: null,
    }
    // In --json mode the JSON payload is the answer — exit 0 so scripts
    // can parse it. In human mode treat it as a check and exit 1.
    if (opts.json) {
      console.log(JSON.stringify(info, null, 2))
      return
    }
    console.error('not in a git repo')
    process.exit(1)
  }

  const [commonDir, topLevel, branch, remote] = await Promise.all([
    getGitCommonDir(),
    getTopLevel(),
    getCurrentBranch(),
    getRemoteUrl(),
  ])
  const ownerRepo = remote ? parseOwnerRepo(remote) : null

  const info: CurrentInfo = {
    inGitRepo: true,
    isLinked: gitDir !== commonDir,
    path: topLevel,
    name: path.basename(topLevel),
    branch,
    gitDir,
    owner: ownerRepo?.owner ?? null,
    repo: ownerRepo?.repo ?? null,
  }

  if (opts.json) {
    console.log(JSON.stringify(info, null, 2))
    return
  }

  console.log(`path:   ${info.path}`)
  console.log(`name:   ${info.name}`)
  console.log(`branch: ${info.branch ?? '(detached)'}`)
  console.log(`gitdir: ${info.gitDir}`)
  console.log(`linked: ${info.isLinked ? 'yes' : 'no (main repo)'}`)
  if (info.owner && info.repo) {
    console.log(`owner:  ${info.owner}`)
    console.log(`repo:   ${info.repo}`)
  }
}
