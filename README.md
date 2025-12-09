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

Deploy everything to Cloudflare's global network with a single command.

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

一条命令将所有应用部署到 Cloudflare 全球网络。

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

---

## 📄 License

MIT © Nshen.net
