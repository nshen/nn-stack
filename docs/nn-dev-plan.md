# nn-dev: 全自动开发编排技能

## Context

用户需要一个全流程自动化技能：接收开发任务（plan 文档或 `/opsx:apply`）→ 编码 → 本地 3 轮 review → commit + push → 创建 PR → 轮询 reviewer 评论 → 自动修复/回复 → 循环直到 merge ready。

不修改任何现有命令，全部新建。

## 交付物（3 个文件）

### 文件 1: `/home/claude/.claude/commands/nn-dev.md` — 主编排命令

选择 command 而非 skill，因为是用户主动调用（`/nn-dev <plan>`），不是被动触发。

**用法**:
- `/nn-dev <plan 内容或文件路径>` — 从头开始：开发 → review → push → poll
- `/nn-dev` — 无参数时，跳过开发阶段，从当前改动开始 review → push → poll

**6 个阶段**:

#### 阶段 0: 前置检查
- 检查 `.git` 是否是文件（不是目录）
  - 如果是目录 → 说明在主仓库，不在 worktree 中
  - 输出错误提示并退出:
    ```
    ❌ 当前不在 nn worktree 中。请先创建:
      nn w <name>          创建并进入 worktree
      nn w <name> --branch <branch>  指定分支名
    ```
- 读取 nn-state.json（每个 worktree 独立一份，互不干扰，支持多 worktree 并行开发）
- 获取分支名、owner/repo（从 `git remote get-url origin` 解析）

#### 阶段 1: 开发（可跳过）
- 有 `$ARGUMENTS`:
  - 如果参数是文件路径（`.md` 结尾且文件存在）→ 读取文件内容作为 plan
  - 否则直接把参数当 plan
  - 按 plan 执行开发（写代码、改文件）
- 无 `$ARGUMENTS`: 跳过，直接进阶段 2
- 未来可集成 `/opsx:apply`（在 plan 内容里写 "调用 /opsx:apply" 即可）

#### 阶段 2: 本地 Review
- 调用 `Skill(skill: "nn-code-review")` 执行多维度 review + 自动修复（最多 3 轮）
- review 完成后继续

#### 阶段 3: Commit + Push + 创建 PR
1. `git add` 所有变更
2. 自动生成 commit message（基于 diff 摘要）
3. `git push -u origin <branch>`
4. 检查 PR 是否存在（`gh pr view`）
5. 无 PR → `gh pr create --base dev`，解析 PR number
6. 更新 nn-state.json（写入 pr 字段）

#### 阶段 4: 轮询 Review 评论（ScheduleWakeup 循环）

每次 wake 执行：

```
1. 调用 /nn-pr-comments <pr> --since <lastReviewId>
   作用：获取 PR 上的新 review 评论，包括：
   - 每条评论的内容、对应文件路径和行号
   - 评论对应的 diff 上下文
   - 初步修改建议（FIX/REPLY/SKIP + 理由）
   - 最新 comment id
   注意：此命令只做拉取和初步分析，不修改任何代码

2. 如果无新评论:
   - lastReviewId 为空(没人 review 过) → 等待，最多 5 次(10min)
   - 连续 2 次无新评论且已有 review → 阶段 5 完成
   - 否则 → ScheduleWakeup(120s)

3. 如果有新评论，主进程根据完整代码上下文做最终决策：
   - Read 评论对应的完整文件，理解上下文
   - 结合 /nn-pr-comments 的建议和实际代码，最终决定：
     a. 确实需要修改 → Edit 修改代码
     b. 不需要修改 → gh api 回复评论，说明理由
     c. 已经修复过 → 跳过
   （主进程有完整项目上下文，能做出比 /nn-pr-comments 更准确的判断）

4. 有代码修改 → git add + commit("fix: address review feedback") + push
5. 更新 nn-state.json 的 lastReviewId
6. ScheduleWakeup(120s)
```

**ScheduleWakeup**: `delaySeconds: 120`

#### 阶段 5: 完成通知
- 输出: PR URL、处理了多少评论、修了几个/回复了几个
- 提示: "PR 已准备好，请 review 后合并"
- 不调用 ScheduleWakeup（退出循环）

---

### 文件 2: `/home/claude/.claude/commands/nn-pr-comments.md` — 增量 PR 评论拉取+分析（只分析，不修改代码）

**关键设计**：此命令只负责拉取和分析评论，**不修改代码**。代码修改由 `/nn-dev` 主进程执行（主进程有完整的项目上下文）。

**用法**: `/nn-pr-comments <pr-number> [--since <lastReviewId>]`

**返回**：结构化的分析结果，供主进程决策和执行

**API 调用策略（优化流量）**:

```
1. gh pr view <number> --json updatedAt,number,title,baseRefName,headRefName
   → 1 次调用
   → 可选：比较 updatedAt，无变化直接返回 "无更新"

2. gh api repos/{owner}/{repo}/pulls/{number}/comments
   → 1 次调用（评论少于 30 条时）
   → 客户端过滤 id > lastReviewId
   → 注意：API 无 since 参数，必须全量拉+本地筛

3. 无新评论 → 输出 "无新评论" 并结束（省掉 diff 拉取）

4. gh pr diff <number>
   → 只在有新评论时拉取
```

**每次 poll: 最少 1 次 API 调用（无更新），最多 3 次（有新评论）**

**评论数据结构（关键字段）**:
```json
{
  "id": 3091159289,          // 用于增量过滤
  "user": { "login": "Copilot", "type": "Bot" },
  "body": "评论内容...",
  "path": "src/foo.ts",      // 评论对应的文件
  "line": 42,                // 行号
  "diff_hunk": "@@...",       // diff 上下文
  "in_reply_to_id": null     // 非空则为回复，跳过
}
```

**输出格式**:

对每条新评论输出分析：
```
## Comment #<id> — @<reviewer>
文件: <path>:<line>
评论: <翻译成中文的内容>
对应代码: <diff_hunk>
建议: FIX / REPLY / SKIP
  FIX — 理由: <为什么要修>
  REPLY — 理由: <为什么不改>，建议回复: <回复内容>
```

最后输出摘要：
```
新评论: N 条
建议修复: X 条
建议回复: Y 条
建议跳过: Z 条
最新 comment id: <max_id>
```

---

**职责分离**: `/nn-pr-comments` 只拉取+分析（可在 subagent 或直接执行），代码修复在 `/nn-dev` 主进程中执行（有完整项目上下文）。

**Fix vs Reply 判断标准（嵌入命令文件）**:
- **修复**: 真 bug、安全问题、缺少错误处理、逻辑错误、明确的改进
- **回复**: 与项目约定冲突、误判、会破坏功能、纯风格偏好、已处理

**回复 PR 评论的 API**:
```bash
gh api repos/{owner}/{repo}/pulls/{pr}/comments/{comment_id}/replies \
  -f body="感谢建议。这里保持现状，原因：..."
```

---

---

### 文件 3: `/home/claude/.claude/commands/nn-code-review.md` — 可调深度的本地 Review

**用法**:
- `/nn-code-review` — 自动判断深度
- `/nn-code-review --quick` — 轻量快速
- `/nn-code-review --deep` — 深度审查

**三级深度**:

| | quick | medium（默认） | deep |
|---|---|---|---|
| 上下文 | 只看 diff | 变更行 ±50 行 | 读完整文件 |
| 轮次 | 1 轮 | 2 轮 | 3 轮 |
| 检查维度 | 正确性、明显 bug | + 一致性、框架用法 | + 安全、边界、健壮性 |
| 速度/Token | 快/少 | 中/中 | 慢/多 |

**自动判断逻辑**（无参数时）：
- 变更文件 ≤ 3 且 diff < 100 行 → quick
- 变更涉及安全/路径/权限/认证相关代码 → deep
- 其他 → medium

**6 维度审查清单**（deep 全用，medium 用前 4 个，quick 用前 2 个）：
1. **正确性**: bug、逻辑错误、off-by-one、null/undefined
2. **明显问题**: 未使用变量、类型错误、缺少 await
3. **一致性**: 跨文件行为一致（A 做了 B 也要做）、命名统一
4. **框架用法**: API 正确用法（parse vs parseAsync、事件监听）
5. **安全性**: 路径逃逸、注入、恶意输入（`..`、`*`、特殊字符）
6. **边界/健壮性**: 空值、无 upstream、相对路径、race condition

**执行流程**:
1. `git diff dev` 获取变更文件和 diff
2. 根据深度决定上下文范围
3. 启动 subagent，prompt 包含具体审查清单 + 变更内容
4. 分析结果 → 有 HIGH/MEDIUM 则修复 → 下一轮（根据深度限制轮次）
5. 审查结果写入 `reviews/` 目录（保持现有格式）

**diff 基准**: `git diff dev`（PR target 是 dev）

---

### nn-state.json 读写（命令共用）

```bash
# 读 gitdir 路径
gitdir=$(cat .git | sed 's/gitdir: //')
# 读 state
cat "$gitdir/nn-state.json"
# 更新字段
node -e "
  const fs=require('fs'), f=process.argv[1];
  const s=JSON.parse(fs.readFileSync(f,'utf8'));
  s.pr=NUMBER; s.lastReviewId=ID;
  fs.writeFileSync(f,JSON.stringify(s,null,2));
" "$gitdir/nn-state.json"
```

## 验证方式

1. 单独测 `/nn-code-review`:
   - 在有改动的 worktree 里运行，观察 6 维度审查 + 修复循环
2. 单独测 `/nn-pr-comments`:
   - `/nn-pr-comments 10` — 全量分析
   - `/nn-pr-comments 10 --since 3093606886` — 增量
3. 测完整流程:
   - `nn w test-dev` → 做一些改动
   - `/nn-dev` — 从 review 开始
   - `/nn-dev "给 format.ts 加 header 分隔线"` — 从开发开始
   - 观察: 开发 → review → commit → push → PR → poll → 修复 → merge ready

## 不做的事

- 不修改现有 /nn-review-loop、/nn-pr-review 命令
- 不修改 packages/cli 代码
- 不自动 merge
- 不处理 rebase/conflict（提示用户）
