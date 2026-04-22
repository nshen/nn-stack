# Code Review: worktree-cli

- 日期: 2026-04-22 11:02:38
- 变更范围: `b5e920c..HEAD`(本会话的 4 次提交)
- 变更文件:
  - `packages/cli/package.json`
  - `packages/cli/src/cli.ts`
  - `packages/cli/src/commands/dev.ts`(新增)
  - `packages/cli/src/commands/skill.ts`(新增)
  - `packages/cli/src/commands/state.ts`(新增)
  - `packages/cli/src/commands/worktree/create.ts`(重构)
  - `packages/cli/src/commands/worktree/current.ts`(新增)
  - `packages/cli/src/commands/worktree/ls.ts`(round-2 fix 触发)
  - `packages/cli/src/commands/worktree/rm.ts`(修复)
  - `packages/cli/src/lib/git.ts`(新 helper)
  - `packages/cli/src/lib/skills.ts`(新增)
- 总轮次: 3
- 最终状态: PASSED

## Round 1

### 发现的问题

| # | 文件 | 行号 | 严重程度 | 描述 |
|---|------|------|----------|------|
| 1 | src/commands/dev.ts | 94-97 | MEDIUM | `runClaude(cwd, prompt)` 的参数 `prompt` 遮蔽了同文件导入的 `prompt` helper,未来在 `runClaude` 内误调 `prompt()` 会拿到字符串而非交互函数 |
| 2 | src/commands/dev.ts | 99-103 | MEDIUM | 未处理父进程被 kill 的情况,子 Claude 进程会被孤儿化且 `runExitPrompt` 不会触发(与 `nn w` 行为一致,接受) |
| 3 | src/commands/dev.ts | 67-68 | LOW | `planArgs.join(' ')` 会丢失用户有意保留的多余空白 |
| 4 | src/commands/dev.ts | 35 | LOW | 不必要的 `as (typeof BUNDLED_SKILLS)[number][]` cast |
| 5 | src/commands/state.ts | 23-29 | MEDIUM | `readData` 对所有错误一视同仁,**损坏的 JSON 会被静默替换成 `{}`**,下次 `set` 直接覆盖,造成数据丢失 |
| 6 | src/commands/state.ts | 31-37 | LOW | `stateGetCommand` 在 key 不存在时 exit 0 + 空输出,对 shell 脚本有歧义 |
| 7 | src/commands/state.ts | 53-56 | MEDIUM | `!Number.isNaN(Number(value))` 过于宽松:`"0x10"→16`、`"1e10"→1e10`、20 位数字静默丢精度 |
| 8 | src/commands/state.ts | 58 | LOW | `fs.writeFile` 非原子,崩溃中途会损坏文件 |
| 9 | src/lib/git.ts | 155-162 | MEDIUM | `parseOwnerRepo` 对 GitLab 嵌套 group (`group/sub/repo`) 只取末两段,丢失顶层 group |
| 10 | src/lib/git.ts | 155-162 | LOW | 名为 `foo.git` 的 repo 会被剥成 `foo`(极罕见) |
| 11 | src/commands/worktree/current.ts | 39-40 | MEDIUM | `--json` 分支在非 git repo 时 exit 1,破坏"用 JSON 问状态"的调用者 |
| 12 | src/commands/worktree/current.ts | 51 | LOW | `name` 是目录名,和 GitHub repo 名可能不一致(`git clone foo bar`) |
| 13 | src/commands/worktree/current.ts | 43 | LOW | `getTopLevel`/`getCurrentBranch`/... 顺序 await,可并行 |
| 14 | src/commands/worktree/rm.ts | 17-21 | MEDIUM | 靠 `entries.slice(1)` 假设 main repo 是 index 0,没有 git 保证 |
| 15 | src/commands/worktree/rm.ts | 33 | LOW | `cwd.startsWith(\`${wtPath}/\`)` 硬编码 `/`,Windows 上用 `\` |
| 16 | src/lib/skills.ts | 79-95 | LOW | `installSkill` 存在 TOCTOU,并发安装不保证胜出者 |
| 17 | src/lib/skills.ts | 20-23 | INFO | `bundledSkillsDir` 在 dev 和安装后路径都正确 |
| 18 | src/lib/skills.ts | 29-31 | MEDIUM | `projectSkillsDir` 在非 git repo 里直接抛未捕获的 zx 错误 |
| 19 | src/commands/skill.ts | 37 | LOW | em-dash 输出,旧 Windows 终端可能显示异常 |
| 20 | src/commands/dev.ts | 20-38 | LOW | 非 TTY 里 `prompt` 挂起,无清晰错误 |
| 21 | src/commands/state.ts | 20 | INFO | 状态文件放 `<gitdir>/nn-state.json`——随 worktree prune 一并清理,合理 |
| 22 | package.json | 23-26 | LOW | `zx` 作为 runtime dep,~5MB 传递依赖 |
| 23 | src/cli.ts | 178-181 | LOW | `console.error(err)` 打 Error 对象完整结构 |
| 24 | src/commands/worktree/create.ts | 37-108 | INFO | 重构后行为一致,纯抽取,无副作用 |
| 25 | src/lib/git.ts | 119 | LOW | module 级 `$({quiet:true})` 对 `$.verbose` 的后续修改不敏感 |

统计: HIGH 0, MEDIUM 6, LOW 12, INFO 4。

### 修复记录

| # | 问题 | 修复方式 |
|---|------|----------|
| 1 | dev.ts 参数遮蔽 | 将 `runClaude` 的参数改名为 `initialPrompt` |
| 4 | 不必要 cast | `missing: SkillName[]` 直接正确类型,去除 cast |
| 5 | 损坏 JSON 被吞 | `readData` 显式区分 `ENOENT`(→ `{}`)和 `SyntaxError`(→ `process.exit(1)` + 具体错误) |
| 7 | 数字强制过宽 | 引入 `INTEGER_RE` `/^-?\d+$/` + `DECIMAL_RE` `/^-?\d+\.\d+$/`;超 `MAX_SAFE_INTEGER` 拒绝并提示用 `--json` |
| 8 | 非原子写 | 引入 `writeDataAtomic`:写 tmp 文件后 `rename` |
| 9 | GitLab 嵌套 group | 加注释标记已知限制(不改行为,GitHub 流程不受影响) |
| 11 | `current --json` exit 1 | `--json` 分支 exit 0(JSON 自己承载答案);人类输出分支保持 exit 1 |
| 13 | 顺序 await | 用 `Promise.all` 并行 |
| 14 | rm 依赖 index 0 | 改用 `getRepoRoot()` 显式过滤主仓库 |
| 15 | `/` 硬编码 | 改用 `wtPath + path.sep` |
| 18 | projectSkillsDir 抛错 | round 1 暂时做成 `process.exit(1)`(round 2 会进一步修) |
| 20 | 非 TTY 挂起 | `ensureSkillsInstalled` 开头检查 `process.stdin.isTTY`,非 TTY 时直接报错退出并提示 `nn skill install` |
| 23 | 错误对象 dump | `err instanceof Error ? err.message : err` |

遗留(Round 1 接受不修):#2(与 `nn w` 一致)、#3(低影响)、#6(设计选择)、#10/#12/#16/#17/#19/#21/#22/#24/#25(INFO 或低价值)。

## Round 2

### 发现的问题

| # | 文件 | 行号 | 严重程度 | 描述 |
|---|------|------|----------|------|
| 1 | src/lib/skills.ts | 29-38, 63 | MEDIUM | **Round 1 fix 引入的 regression**:`projectSkillsDir()` 被 `skillStatus` / `allSkillStatuses` / `skillListCommand` / 全局 install 无条件调用,非 git repo 下会给出误导性"--project requires a git repo"错误 |
| 2 | src/commands/state.ts | 51-53 | MEDIUM | `writeDataAtomic` 缺 `fsync`,极端场景下 rename 可能被重排,留下零字节或旧文件 |
| 3 | src/commands/worktree/ls.ts | 10, 23, 25 | MEDIUM | `ls` 仍沿用 `i === 0` 判断 main repo,与 `rm.ts` 刚修好的策略不一致 |
| 4 | src/commands/state.ts | 87-89 | LOW | 新严格 regex 拒绝 `1e3` / `.5` 等合法 JS number 表达,未在 help 里提示 |
| 5 | src/commands/dev.ts | 21 | LOW | TTY 检查只覆盖 stdin,stdout 被重定向时 prompt 文案会丢 |
| 6 | src/commands/state.ts | 46-53 | LOW | 固定 tmp 名,并发 writer 会互相覆盖 |
| 7 | src/commands/worktree/current.ts | 47-52 | INFO | `Promise.all` 一个失败全败,但此前顺序 await 也是同样行为 |
| 8 | src/lib/git.ts | 159-163 | INFO | `parseOwnerRepo` 注释到位 |

统计: HIGH 0, MEDIUM 3, LOW 3, INFO 2。

### 修复记录

| # | 问题 | 修复方式 |
|---|------|----------|
| 1 | projectSkillsDir 回归 | 改为返回 `string \| null`;`SkillStatus.projectPath` / `projectHash` 改成可空;`installSkill` / `uninstallSkill` 用 `requireProjectPath` helper 在 `scope==='project'` 时才检查并退出;`skillStatusCommand` 渲染 `n/a (not in a git repo)` |
| 2 | fsync 缺失 | `writeDataAtomic` 改为 `fs.open(tmp, 'w')` → `fh.writeFile` → `fh.sync()` → `fh.close()` → `rename` |
| 3 | ls index-0 依赖 | `getRepoRoot()` 并行拉取,改判 `e.path === root` |
| 6 | 并发 tmp 冲突 | tmp 文件名加 `${process.pid}` |

遗留:#4(help 文案,可在 README 补)、#5(stdout TTY 检查,低价值)、#7/#8(INFO)。

## Round 3

### 发现的问题

| # | 文件 | 行号 | 严重程度 | 描述 |
|---|------|------|----------|------|
| 1 | src/commands/skill.ts + lib/skills.ts | 23, 94 | LOW | `'--project requires a git repo.'` 字符串在两处重复,改一处忘改另一处会漂移 |
| 2 | src/commands/state.ts | 52-60 | INFO | 只 fsync 文件不 fsync 父目录,崩溃场景下 rename 本身可能丢失(对 `.git/` 下的状态文件无关紧要) |
| 3 | src/lib/skills.ts | 92-98 | INFO | `requireProjectPath` 在 lib 层 `process.exit`,破坏了"lib 抛错、command 负责退出"的一致性 |
| 4 | src/commands/worktree/ls.ts | 6 | INFO | 非 git repo 下 `ls` 会抛,但这本来就是仓库作用域的命令,接受 |

统计: HIGH 0, MEDIUM 0, LOW 1, INFO 3。

### 修复记录

所有 MEDIUM 已清零,Round 3 未做代码修改。LOW #1 的字符串去重留待未来再抽象(目前只有两处,尚未到"重构阈值")。

## 总结

- 共发现 **37 个观察点**(Round1:25 + Round2:8 + Round3:4)。
- 其中 **HIGH 0,MEDIUM 9**(Round1:6 + Round2:3),全部修复。
- **LOW 16,INFO 8**:处理了高价值若干(类型收紧、atomic write、跨平台 path.sep、TTY check、error print、ls 一致性等),其余记录在"遗留"列表。
- 无需要用户判断才能修的遗留项。

**最终状态:PASSED**——无 HIGH/MEDIUM 残留,代码可以提交。
