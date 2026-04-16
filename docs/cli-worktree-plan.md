# `nn` CLI — Worktree 管理实现计划

## 背景

在 `packages/cli` 新建一个独立的 CLI 工具 `nn`,第一期只做 git worktree 的管理,不绑定任何 agent。

**设计原则**

- 纯粹的 worktree 管理,不启动 claude / codex / 其他 agent
- 已开源给他人使用,**不能要求用户修改 `~/.zshrc`**
- 复用 Claude Code 自带的 `claude -w <name>` 不冲突,我们只管理,不重复创建逻辑
- 为后续"偷偷记录 PR 进度"留 hook(`.git/worktrees/<name>/nn-state.json`)

---

## 包结构

```
packages/cli/
├── package.json              # @nn-stack/cli, bin: { nn: dist/cli.js }
├── tsconfig.json             # 继承根
├── biome.json                # 继承根
├── tsup.config.ts            # ESM, node20 target, shebang 注入
├── README.md                 # 用法 + 可选 shell function
└── src/
    ├── cli.ts                # commander 入口
    ├── commands/
    │   └── worktree/
    │       ├── create.ts     # nn w <name>       (默认动作)
    │       ├── rm.ts         # nn w rm <name>
    │       ├── ls.ts         # nn w ls
    │       └── prune.ts      # nn w prune
    └── lib/
        ├── paths.ts          # worktree 路径约定
        ├── state.ts          # .git/worktrees/<name>/nn-state.json 读写
        ├── git.ts            # git 命令封装 (zx)
        ├── tmux.ts           # tmux pane 占用检测
        ├── subshell.ts       # exec subshell + exit 交互
        ├── prompt.ts         # 简易 readline 交互
        └── format.ts         # 表格输出
```

---

## 技术栈

| 组件 | 选型 | 理由 |
|------|------|------|
| 语言 | TypeScript (catalog 版本) | 和 monorepo 一致 |
| CLI 框架 | `commander` ^12 | 主流,help/option 齐全 |
| Shell 调用 | `zx` (lite export) | 不污染全局,小 |
| 构建 | `tsup` | 快,零配置,watch 模式友好 |
| 运行入口 | `dist/cli.js` + shebang `#!/usr/bin/env node` | build 后纯 JS,启动快 |
| 分发 | `pnpm link --global` | dev 时 `pnpm dev`(tsup watch)改完即用 |

**package.json 关键字段**

```json
{
  "name": "@nn-stack/cli",
  "type": "module",
  "bin": { "nn": "./dist/cli.js" },
  "scripts": {
    "build": "tsup src/cli.ts --format esm --target node20 --clean --banner='{\"js\":\"#!/usr/bin/env node\"}'",
    "dev":   "tsup src/cli.ts --format esm --target node20 --watch --banner='{\"js\":\"#!/usr/bin/env node\"}'",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "commander": "^12",
    "zx": "lite"
  },
  "devDependencies": {
    "tsup": "^8",
    "typescript": "catalog:",
    "@types/node": "catalog:"
  }
}
```

---

## 命令集

### `nn w <name>` — 创建或复用 worktree

别名: `nn worktree <name>`

**参数**
- `<name>` (必填): worktree 名字。禁止 `rm` / `ls` / `prune`。
- `--branch <branch>` (可选): 指定分支名。默认 `feat/<name>`。
- `--print-path` (可选): 只输出 worktree 绝对路径到 stdout,不跳转。用于脚本集成。

**行为**

1. 校验 `<name>` 不在 reserved set
2. 解析 worktree 路径:`<主仓父目录>/<主仓名>-worktrees/<name>`
   - 例:在 `~/github/nn-stack` 里跑 `nn w planA` → `~/github/nn-stack-worktrees/planA`
3. 判断 worktree 是否已存在(`git worktree list --porcelain`)
   - **已存在**:跳过创建,直接进入(幂等)
   - **不存在**:
     - 校验分支名不冲突(`git branch --list`)
     - `git worktree add <path> -b <branch>`
     - 写 state 文件到 `.git/worktrees/<name>/nn-state.json`
4. 若传了 `--print-path`:打印路径到 stdout,exit 0
5. 否则:进入子 shell(见下)

**state 文件格式**

```json
{
  "name": "planA",
  "branch": "feat/planA",
  "repo": "/Users/nn/github/nn-stack",
  "createdAt": "2026-04-16T10:00:00Z",
  "pr": null,
  "lastReviewId": null
}
```

存放位置:`<主仓>/.git/worktrees/<name>/nn-state.json`

- git 为每个 worktree 创建这个元数据目录,里面放任意文件都不会被跟踪
- worktree 被 `git worktree remove` 时,git 会自动清理这个目录
- 不污染 `.gitignore`,不改动 tracked 文件

---

### 子 shell 机制(创建/复用后的核心交互)

**进入**

```ts
const shell = process.env.SHELL || '/bin/sh'  // Windows: process.env.ComSpec || 'cmd.exe'
const child = spawn(shell, [], {
  stdio: 'inherit',
  cwd: worktreePath,
  env: { ...process.env, NN_WORKTREE: name }  // 让子 shell 知道自己在 worktree 里
})
await new Promise<{ code: number | null, signal: string | null }>(resolve => {
  child.on('exit', (code, signal) => resolve({ code, signal }))
})
```

**退出后的分支**

| 退出情况 | 判断 | 处理 |
|---------|------|------|
| 正常退出 (code 0) | `code === 0 && !signal` | 弹 keep/delete prompt |
| 异常退出 (非 0 code 或 signal) | `code !== 0 \|\| signal` | 只打印 resume 提示,不弹 prompt |

**正常退出的 prompt**

```
── Worktree: planA ────────────────────────
  branch:  feat/planA
  dirty:   no
  ahead:   3 commits unpushed
  PR:      not created
───────────────────────────────────────────

  [k] Keep (default)
  [d] Delete worktree + branch

choice [k/d]:
```

保护规则:
- 默认 keep:回车 / Ctrl-C / 任何非 `d` 输入 → keep
- 若 dirty 或有 unpushed commits,选 `d` 时二次确认:
  ```
  ⚠ You have 3 unpushed commits. Delete anyway?
  Type 'yes' to confirm:
  ```
  必须敲完整 `yes` 才删除

**异常退出的提示**

```
⚠ Subshell exited abnormally (SIGTERM)
Worktree preserved. Resume with:
  nn w planA
```

设计理由:异常退出通常是用户手忙脚乱,此时弹 delete prompt 容易误操作。直接保留 + 告诉用户怎么回来最安全。

**SIGKILL 的边界**:接不住。但 worktree 在磁盘上,`nn w planA` 仍然能幂等进入。

---

### `nn w rm <name>` — 删除 worktree

**参数**
- `<name>` (必填)
- `-f, --force`: dirty 或有 unpushed 时强制删除
- `-y, --yes`: 跳过确认 prompt
- `--keep-branch`: 删 worktree 目录但保留分支

**行为**

1. 查找 worktree 路径(`git worktree list --porcelain`)
   - 未找到 → 报错退出
2. 检查 dirty:`git -C <path> status --porcelain`
   - 有未提交改动 + 非 `-f` → 报错,提示加 `-f`
3. 检查 tmux 占用:扫 `tmux list-panes -a -F '#{pane_current_path}'`
   - 有 pane 的 cwd 在 worktree 路径下 + 非 `-f` → 报错,列出 pane 位置
   - 注:tmux 没装 / 没 server 跑着时静默跳过
4. 显示要删除的内容 + 要求确认(除非 `-y`)
   ```
   Remove worktree:
     path:   ~/github/nn-stack-worktrees/planA
     branch: feat/planA (will be deleted, pass --keep-branch to keep)
     dirty:  no

   Proceed? [y/N]:
   ```
5. `git worktree remove [--force] <path>`
6. `git branch -D <branch>`(除非 `--keep-branch`)
7. 输出结果

**不做**:不试图自动 kill tmux pane / iTerm tab / claude 进程。用户自己负责 exit。

---

### `nn w ls` — 列出所有 worktree

**参数**
- `--json`: 输出 JSON(脚本集成)

**行为**

1. `git worktree list --porcelain` 解析
2. 对每个 worktree:
   - 读取 `<gitdir>/nn-state.json`(可能不存在,nn 之外创建的 worktree 也显示)
   - 判断 dirty(`git status --porcelain`)
   - 判断 ahead/behind(`git rev-list --left-right --count`)
3. 美化输出:

```
NAME        BRANCH              PATH                                     DIRTY  AHEAD   PR
(main)      dev                 ~/github/nn-stack                        -      -       -
planA       feat/planA          ~/github/nn-stack-worktrees/planA        no     3       #123
planB       feat/planB          ~/github/nn-stack-worktrees/planB        yes    1       -
(orphan)    feat/old            (prunable)                               -      -       -
```

`--json` 模式输出结构化数据,字段同 state 文件 + 动态字段(dirty/ahead/behind/prunable)。

---

### `nn w prune` — 清理孤儿元数据

**行为**

1. `git worktree list --porcelain` 找出 `prunable` 条目
2. 显示列表,要求确认:
   ```
   Prunable worktrees:
     - feat/old       (gitdir file points to non-existent location)

   Prune? [y/N]:
   ```
3. `git worktree prune`
4. 提示是否同时删对应分支(orphan 可能留着分支):
   ```
   Orphan branches:
     - feat/old
   Delete them too? [y/N]:
   ```

---

## 关键库实现要点

### `lib/paths.ts`

```ts
import path from 'node:path'
import { $ } from 'zx'

export async function getRepoInfo() {
  const root = (await $`git rev-parse --show-toplevel`).stdout.trim()
  return {
    root,
    parent: path.dirname(root),
    repoName: path.basename(root),
  }
}

export async function worktreeDirFor(name: string): Promise<string> {
  const { parent, repoName } = await getRepoInfo()
  return path.join(parent, `${repoName}-worktrees`, name)
}
```

### `lib/state.ts`

```ts
import fs from 'node:fs/promises'
import path from 'node:path'

export interface NNState {
  name: string
  branch: string
  repo: string
  createdAt: string
  pr: number | null
  lastReviewId: number | null
}

// worktree 的 .git 是一个文件,内容 "gitdir: /absolute/path/to/main/.git/worktrees/<name>"
async function getGitDir(worktreePath: string): Promise<string> {
  const dotGit = await fs.readFile(path.join(worktreePath, '.git'), 'utf8')
  const match = dotGit.match(/^gitdir:\s*(.+)$/m)
  if (!match) throw new Error(`Not a git worktree: ${worktreePath}`)
  return match[1].trim()
}

export async function writeState(worktreePath: string, state: NNState) {
  const dir = await getGitDir(worktreePath)
  await fs.writeFile(path.join(dir, 'nn-state.json'), JSON.stringify(state, null, 2))
}

export async function readState(worktreePath: string): Promise<NNState | null> {
  try {
    const dir = await getGitDir(worktreePath)
    const raw = await fs.readFile(path.join(dir, 'nn-state.json'), 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}
```

### `lib/git.ts`(zx 封装)

```ts
import { $ } from 'zx'

export interface WorktreeEntry {
  path: string
  head: string
  branch: string | null
  isBare: boolean
  isDetached: boolean
  prunable: boolean
  prunableReason: string | null
}

export async function listWorktrees(): Promise<WorktreeEntry[]> {
  const out = (await $`git worktree list --porcelain`).stdout
  return parsePorcelain(out)
}

export async function addWorktree(path: string, branch: string) {
  await $`git worktree add ${path} -b ${branch}`
}

export async function removeWorktree(path: string, force: boolean) {
  if (force) await $`git worktree remove --force ${path}`
  else       await $`git worktree remove ${path}`
}

export async function pruneWorktrees() {
  await $`git worktree prune`
}

export async function isDirty(path: string): Promise<boolean> {
  const out = (await $`git -C ${path} status --porcelain`).stdout
  return out.trim().length > 0
}

export async function aheadBehind(path: string): Promise<{ ahead: number; behind: number }> {
  try {
    // 动态获取 tracking branch,无需硬编码
    const upstream = (await $`git -C ${path} rev-parse --abbrev-ref @{upstream}`).stdout.trim()
    const out = (await $`git -C ${path} rev-list --left-right --count HEAD...${upstream}`).stdout.trim()
    const [ahead, behind] = out.split(/\s+/).map(Number)
    return { ahead: ahead || 0, behind: behind || 0 }
  } catch {
    return { ahead: 0, behind: 0 }
  }
}

export async function deleteBranch(name: string, force = true) {
  await $`git branch ${force ? '-D' : '-d'} ${name}`
}
```

porcelain 解析:每个 worktree 块之间空行分隔,字段 `worktree` / `HEAD` / `branch` / `bare` / `detached` / `prunable`。

### `lib/tmux.ts`

```ts
import { $ } from 'zx'

export async function findPanesUnder(targetPath: string): Promise<string[]> {
  try {
    const out = (await $`tmux list-panes -a -F #{session_name}:#{window_index}.#{pane_index}\t#{pane_current_path}`).stdout
    const prefix = targetPath.endsWith('/') ? targetPath : targetPath + '/'
    return out
      .split('\n')
      .filter(Boolean)
      .filter(line => {
        const [, cwd] = line.split('\t')
        return cwd === targetPath || (cwd && cwd.startsWith(prefix))
      })
      .map(line => line.split('\t')[0])
  } catch {
    return []  // tmux 没装 / server 没跑
  }
}
```

### `lib/subshell.ts`

```ts
import { spawn } from 'node:child_process'

export async function enterSubshell(cwd: string, worktreeName: string): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  const shell = process.env.SHELL || (process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : '/bin/sh')
  return new Promise(resolve => {
    const child = spawn(shell, [], {
      stdio: 'inherit',
      cwd,
      env: { ...process.env, NN_WORKTREE: worktreeName },
    })
    child.on('exit', (code, signal) => resolve({ code, signal }))
  })
}
```

### `lib/prompt.ts`

不引入重型依赖(inquirer 太大),用 node 原生 readline:

```ts
import { createInterface } from 'node:readline/promises'

export async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    return (await rl.question(question)).trim()
  } finally {
    rl.close()
  }
}
```

---

## CLI 入口 dispatch 逻辑

使用 commander 原生 subcommand。`nn w` 和 `nn worktree` 互为别名,`w` 下再挂 `ls` / `rm` / `prune` 子命令,默认动作(无子命令时)走 create:

```ts
// src/cli.ts
import { Command } from 'commander'

const program = new Command()
program.name('nn').version('0.1.0').description('nn personal CLI')

// worktree 子命令
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
```

`reserved.ts` 不再需要,commander 自动处理 `ls` / `rm` / `prune` 与 `<name>` 的冲突 — 子命令优先于 argument。

---

## 实现分期(按交付顺序)

### Phase 1: 骨架 + `ls`(最容易验证)

- 创建 `packages/cli` 目录 + 配置文件
- 安装依赖,`pnpm link --global`
- 实现 `lib/git.ts` 的 `listWorktrees` + porcelain 解析
- 实现 `nn w ls`
- 跑 `nn w ls` 看到当前 nn-stack 的 worktree 列表(应该有一个 prunable 的)

**通过标准**:能在任意 nn-stack 子目录跑 `nn w ls`,看到美化表格。

### Phase 2: `prune`

- 实现 `lib/git.ts` 的 `pruneWorktrees`
- 实现 `nn w prune` 交互
- 跑一次清掉现有的 prunable

**通过标准**:之前 prunable 的 worktree 消失,`nn w ls` 干净。

### Phase 3: `create`(含子 shell)

- 实现 `lib/paths.ts`、`lib/state.ts`
- 实现 `lib/subshell.ts`
- 实现 `nn w <name>` 默认分支:
  - 创建 worktree
  - 写 state
  - exec subshell
  - 正常退出 → 弹 keep/delete prompt
  - 异常退出 → 打印 resume 提示
- 实现 `--print-path`

**通过标准**:
- `nn w test1` 创建成功,子 shell 的 pwd 是 worktree 路径
- `exit` 弹 prompt,选 `k` 保留,选 `d` 删除
- `nn w test1` 再次进入(幂等)
- `NN_WORKTREE` 环境变量在子 shell 里能读到
- `nn w test1 --print-path` 只输出路径

### Phase 4: `rm`

- 实现 dirty 检测
- 实现 tmux 占用检测
- 实现 `nn w rm <name>` 含 `-f` / `-y` / `--keep-branch`
- 二次确认 dirty / unpushed

**通过标准**:
- `nn w rm test1` 删除成功
- dirty 状态下不加 `-f` 会报错
- tmux 里有 pane 在 worktree 时不加 `-f` 会报错
- `--keep-branch` 删目录保留分支

### Phase 5: 完善 `ls`

- 加 dirty / ahead / behind / PR 字段
- 加 `--json` 输出
- 加 orphan 标记

---

## 开源考虑

- README 包含:
  - 安装方法(`pnpm install -g @nn-stack/cli` 或源码 `pnpm link --global`)
  - 命令用法 + 示例
  - **Shell function 提示**(可选):给想要"当前 shell 直接 cd"体验的用户一段 10 行的 bash/zsh/fish function 模板
  - 已知限制:`nn w <name>` 启动子 shell,`exit` 返回原 terminal;SIGKILL 接不住但 worktree 仍在
- 不在 dependency 里引入 inquirer / chalk 之类重依赖,启动快
- 跨平台:Unix 优先,Windows 只保证基本能跑(shell fallback cmd.exe)

---

## 不做的事(明确划界)

- 不启动 agent(claude / codex / aider)—— 用户自己在子 shell 里敲
- 不做 PR 监控 / Copilot 循环 —— 下一期,`nn w watch` 或独立 skill
- 不做自动 push / merge —— 下一期
- 不做 worktree 之外的功能(project / notes / snippets)—— 以后
- 不做交互式选择器(列表选 worktree)—— 先走纯 CLI 参数

---

## 验证清单(跑通一遍)

在 `~/github/nn-stack` 根目录:

```bash
cd packages/cli
pnpm install
pnpm link --global
pnpm dev           # 后台 watch build

# 新终端
nn --version                    # 0.1.0
nn w ls                        # 看到现有 worktree + prunable 标记
nn w prune                     # 清掉 prunable
nn w test1                     # 创建 + 进入子 shell
# 在子 shell 里:
pwd                             # ~/github/nn-stack-worktrees/test1
echo $NN_WORKTREE               # test1
exit
# 弹 keep/delete prompt,选 k
nn w ls                        # 看到 test1
nn w test1                     # 再次进入(幂等)
exit                            # 再次弹 prompt,选 d
# 二次确认(如果 dirty) 或直接删
nn w ls                        # test1 消失
```

全部通过 = phase 1-4 完成。
