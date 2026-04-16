# nn-dev Step 2: 统一入口 + npx 调用

## 背景

Step 1 的 plan 中，用户需要先全局安装 nn CLI（`pnpm link --global`），然后 `nn w <name>` 创建 worktree，再打开 Claude 跑 `/nn-dev`。流程割裂，两套工具切换对用户困惑。

## 变更：nn-dev 阶段 0 支持 --worktree

### 用法扩展

```
/nn-dev --worktree <name> "task description"   # 自动创建 worktree 后开始
/nn-dev "task description"                      # 在已有 worktree 中开始
/nn-dev                                         # 从当前改动开始 review
```

### 阶段 0 新流程

1. 解析 `$ARGUMENTS`，提取 `--worktree <name>`（如有）
2. 如果有 `--worktree`:
   - 用 `npx @nn-stack/cli w <name> --print-path` 获取 worktree 路径
   - cd 到该路径工作
   - **用户不需要全局安装 nn CLI**，npx 自动下载执行
3. 检查 `.git` 是否是文件（确认在 worktree 中）
   - 不在 worktree 且没传 `--worktree` → 提示:
     ```
     不在 worktree 中。使用 --worktree <name> 自动创建:
       /nn-dev --worktree planA "task description"
     ```
4. 读取 nn-state.json
5. 获取分支名、owner/repo

### 安装方式变更

| 之前 | 之后 |
|------|------|
| 必须 `pnpm link --global` 安装 nn CLI | 用户只需要 Claude Code |
| 手动 `nn w <name>` 创建 worktree | `/nn-dev --worktree <name>` 自动创建 |
| 两套工具来回切 | 一个 `/nn-dev` 命令搞定 |

### nn CLI 发布到 npm

- 包名: `@nn-stack/cli`
- Claude 命令通过 `npx @nn-stack/cli` 调用
- 想独立用 worktree 管理的用户可选 `npm i -g @nn-stack/cli`
- `--print-path` 模式完美适配自动化：不进子 shell，只返回路径

### 对 step 1 plan 的影响

- **nn-dev.md**: 阶段 0 改为上述新流程
- **nn-pr-comments.md**: 不变
- **nn-code-review.md**: 不变
- **packages/cli**: 不改代码，只需发布到 npm
