# NN-Stack ⚡️

[中文](#nn-stack-中文)

NN-Stack is an opinionated **Full Stack Starter Kit** built for **Cloudflare's Edge Network**. It runs **Next.js** (Frontend) and **Hono** (Backend) as independent Workers connected by **End-to-End Type Safety**. Forget complex configuration, **deploy globally with a single command. Runs for $0/month.**

---

## 🚀 Key Features

- **Zero Cost**: Runs 100% on Cloudflare (Workers + D1). $0/month for most hobby/startup apps.
- **End-to-End Type Safety**: Shared Zod schemas + ORPC. Frontend calls backend like a local function.
- **Infrastructure from Code**: Powered by **Alchemy.run**. No `wrangler.toml`. Just TypeScript.
- **AI-First Workflow**: Optimized for LLMs. Includes [GEMINI.md](./GEMINI.md) context file for instant agent onboarding.
  - Prompt Example: "Read GEMINI.md, then create a todos table and expose a getTodos API."

---

## 🛠️ Tech Stack

| Category           | Technology                | Description                        |
| :----------------- | :------------------------ | :--------------------------------- |
| **Frontend**       | **Next.js (OpenNext)**    | Edge-optimized React framework.    |
| **Backend**        | **Hono**                  | Ultra-fast standard web framework. |
| **Communication**  | **ORPC + TanStack Query** | E2E Type-safe RPC                  |
| **Database**       | **Cloudflare D1/KV**      | Serverless SQLite at the edge.     |
| **ORM**            | **Drizzle ORM**           | Lightweight, type-safe SQL ORM.    |
| **UI**             | **Tailwind V4 + Shadcn**  | Modern, accessible styling.        |
| **Infrastructure** | **Alchemy.run**           | TypeScript-based IaC.              |
| **Linting**        | **Biome**                 | Fast linting and formatting.       |

---

## Project Structure

```text
nn-stack/
├── apps/
│   ├── server/    # Hono Server Worker
│   └── web/       # Next.js Frontend Worker
└── packages/
    ├── api/       # Shared ORPC API definitions & Zod schemas
    ├── db/        # Drizzle Schema & Migrations
    ├── ui/        # Shared Shadcn UI components
    └── config/    # Shared TS configs
```

---

## ⚡️ Getting Started

### Prerequisites

- Node.js (v20+)
- pnpm (`npm i -g pnpm`)
- Cloudflare Account

### 1. Installation

Clone the repo and install dependencies.

```bash
git clone https://github.com/your-username/nn-stack.git
cd nn-stack
pnpm install
```

### 2. Development

Start the full stack (Frontend + Backend + DB) locally. Alchemy handles the local emulation.

```bash
pnpm dev
```

- **Web:** http://localhost:3000
- **Server:** http://localhost:4000

### 3. Authentication

Authenticate with Cloudflare to grant deployment permissions.

```bash
pnpm alchemy configure
pnpm alchemy login
```

### 4. Deployment

Deploy everything to Cloudflare's global network.

#### Manual Deployment

```bash
# Deploy to Development environment
pnpm run deploy:dev
```

> **First-Time Setup:**
> For the first deploy, link the services by updating their `.env` files:
>
> - `apps/web/.env`: Set `NEXT_PUBLIC_SERVER_URL` to your Backend URL.
> - `apps/server/.env`: Set `CORS_ORIGIN` to your Frontend URL.
>
> Then redeploy once to apply the changes.

```bash
# Deploy to Production environment
pnpm run deploy:prod
```

#### Automated CI/CD Deployment

This project includes a fully configured GitHub Actions workflow (`.github/workflows/deploy.yml`) for automated CI/CD. It supports two completely isolated environments, providing a safe and professional deployment strategy:

- **`dev` branch** automatically deploys to the **Development** environment (e.g., [https://nn-stack-web-dev.nshen.workers.dev](https://nn-stack-web-dev.nshen.workers.dev)). Use this for testing and staging.
- **`main` branch** automatically deploys to the **Production** environment (e.g., [https://nn-stack-web-prod.nshen.workers.dev](https://nn-stack-web-prod.nshen.workers.dev)). Use this for your live, user-facing application.

To enable automated deployment, add the following **Repository Secrets** in your GitHub repository (*Settings -> Secrets and variables -> Actions -> New repository secret*):

1. **`CLOUDFLARE_API_TOKEN`**: Your Cloudflare API Token. Generate one mirroring your permissions by running: `pnpm dlx alchemy util create-cloudflare-token`.
2. **`ALCHEMY_STATE_TOKEN`**: A random 32-character hex string for Alchemy state management. Generate via: `openssl rand -hex 32`. Must be the same across all projects under the same Cloudflare account.
3. **`CLOUDFLARE_EMAIL`**: Your Cloudflare account login email.
4. **`ENV_SERVER_DEV` / `ENV_SERVER_PROD`**: The full content of your `apps/server/.env` file for the respective environment. This injects your backend environment variables securely.
5. **`ENV_WEB_DEV` / `ENV_WEB_PROD`**: The full content of your `apps/web/.env` file for the respective environment. This injects your frontend environment variables securely.

Upload local env files to GitHub Secrets via CLI:

```bash
gh secret set ENV_SERVER_DEV < apps/server/.dev.env
gh secret set ENV_SERVER_PROD < apps/server/.env
gh secret set ENV_WEB_DEV < apps/web/.dev.env
gh secret set ENV_WEB_PROD < apps/web/.env
```

---

## 📄 License

MIT © Nshen.net

---

# NN-Stack 中文

NN-Stack 是一套**有主见（Opinionated）的全栈 Starter Kit**，专为 **Cloudflare 边缘网络**打造。它将 **Next.js**（前端）和 **Hono**（后端）作为独立的 Worker 运行，并通过**端到端（End-to-End）类型安全**进行连接。告别繁琐配置，**一条命令全球部署。运行成本 $0/月。**

---

## 🚀 核心特性

- **零成本**: 100% 运行在 Cloudflare (Workers + D1) 上。绝大多数个人项目/初创应用 $0/月。
- **端到端类型安全**: 共享 Zod Schema + ORPC。前端调用后端就像调用本地函数一样。
- **基础设施即代码**: 由 **Alchemy.run** 驱动。告别 `wrangler.toml`。只写 TypeScript。
- **AI 优先工作流**: 为 LLM 优化。内置 [GEMINI.md](./GEMINI.md) 上下文文件，AI 助手开箱即用。
  - Prompt 示例: "阅读 GEMINI.md，然后在创建 todos 表并暴露一个 getTodos API。"

---

## 🛠️ 技术栈

| 类别               | 技术                      | 描述                         |
| :----------------- | :------------------------ | :--------------------------- |
| **Frontend**       | **Next.js (OpenNext)**    | 针对边缘优化的 React 框架。  |
| **Backend**        | **Hono**                  | 超快的 Web 标准框架。        |
| **Communication**  | **ORPC + TanStack Query** | 端到端类型安全 RPC           |
| **Database**       | **Cloudflare D1/KV**      | 边缘 Serverless SQLite。     |
| **ORM**            | **Drizzle ORM**           | 轻量级、类型安全的 SQL ORM。 |
| **UI**             | **Tailwind V4 + Shadcn**  | 现代化的原子类与组件库。     |
| **Infrastructure** | **Alchemy**               | 基于 TS 的基础设施即代码。   |
| **Linting**        | **Biome**                 | 极速 Lint 和格式化。         |

---

## 项目结构

```text
nn-stack/
├── apps/
│   ├── server/    # Hono 后端 Worker
│   └── web/       # Next.js 前端 Worker
└── packages/
    ├── api/       # 共享 ORPC API 定义 & Zod Schemas
    ├── db/        # Drizzle Schema & Migrations
    ├── ui/        # 共享 Shadcn UI 组件
    └── config/    # 共享 TS 配置
```

---

## ⚡️ 快速开始

### 前置要求

- Node.js (v20+)
- pnpm (`npm i -g pnpm`)
- Cloudflare 账号

### 1. 安装

克隆仓库并安装依赖。

```bash
git clone https://github.com/your-username/nn-stack.git
cd nn-stack
pnpm install
```

### 2. 开发

启动本地全栈开发环境（前端 + 后端 + 数据库）。Alchemy 会自动处理本地模拟。

```bash
pnpm dev
```

- **Web:** http://localhost:3000
- **Server:** http://localhost:4000

### 3. 认证

登录 Cloudflare 授权部署权限。

```bash
pnpm alchemy configure
pnpm alchemy login
```

### 4. 部署

将所有应用部署到 Cloudflare 全球网络。

#### 手动部署

```bash
# 部署到开发环境 (Development)
pnpm run deploy:dev
```

> **首次设置:**
> 第一次部署时，通过更新 `.env` 文件来连接前后端服务：
>
> - `apps/web/.env`: 设置 `NEXT_PUBLIC_SERVER_URL` 为你的后端 URL。
> - `apps/server/.env`: 设置 `CORS_ORIGIN` 为你的前端 URL。
>
> 然后重新运行一次部署命令以应用更改。

```bash
# 部署到生产环境 (Production)
pnpm run deploy:prod
```

#### 自动化 CI/CD 部署

本项目包含一个配置完整的 GitHub Actions 工作流 (`.github/workflows/deploy.yml`) 用于自动 CI/CD。它支持两个完全隔离的环境，提供了安全、专业的部署策略优势：

- **`dev` 分支** 自动部署到 **开发环境 (Development)**（例如：[https://nn-stack-web-dev.nshen.workers.dev](https://nn-stack-web-dev.nshen.workers.dev)）。用于测试和预发布。
- **`main` 分支** 自动部署到 **生产环境 (Production)**（例如：[https://nn-stack-web-prod.nshen.workers.dev](https://nn-stack-web-prod.nshen.workers.dev)）。用于正式的线上应用。

要启用自动部署，请在您的 GitHub 仓库中添加以下 **Repository Secrets** (*Settings -> Secrets and variables -> Actions -> New repository secret*)：

1. **`CLOUDFLARE_API_TOKEN`**: Cloudflare API 令牌。运行 `pnpm dlx alchemy util create-cloudflare-token` 生成一个包含当前权限的令牌。
2. **`ALCHEMY_STATE_TOKEN`**: 用于 Alchemy 状态管理的随机字符串。可通过 `openssl rand -hex 32` 生成, 如果 cloudflare 下有多个项目必须相同。
3. **`CLOUDFLARE_EMAIL`**: 您的 Cloudflare 账号登录邮箱。
4. **`ENV_SERVER_DEV` / `ENV_SERVER_PROD`**: 分别对应各环境下 `apps/server/.env` 文件的完整内容。这确保了后端环境变量的安全注入。
5. **`ENV_WEB_DEV` / `ENV_WEB_PROD`**: 分别对应各环境下 `apps/web/.env` 文件的完整内容。这确保了前端环境变量的安全注入。

通过 CLI 上传本地 env 文件到 GitHub Secrets：

```bash
gh secret set ENV_SERVER_DEV < apps/server/.dev.env
gh secret set ENV_SERVER_PROD < apps/server/.env
gh secret set ENV_WEB_DEV < apps/web/.dev.env
gh secret set ENV_WEB_PROD < apps/web/.env
```

---

## 📄 License

MIT © Nshen.net
