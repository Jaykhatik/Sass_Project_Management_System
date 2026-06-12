# 🚀 SaaS Project Management System

A full-featured, multi-tenant SaaS Project Management platform built with **Next.js 14**, **PostgreSQL**, **Prisma ORM**, and **TypeScript**. Designed for teams to manage projects, tasks, sprints, and collaborators — all in one place.

---

## 📚 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [API Routes](#api-routes)
- [Authentication](#authentication)
- [Multi-Tenancy](#multi-tenancy)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

This platform enables organizations to:

- Create and manage **workspaces** (tenants)
- Invite **team members** with role-based access
- Organize work into **projects**, **boards**, **sprints**, and **tasks**
- Track progress with **dashboards**, **timelines**, and **activity feeds**
- Collaborate with **comments**, **mentions**, and **file attachments**
- Manage subscriptions and **billing** per workspace

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL 15+ |
| ORM | Prisma |
| Auth | NextAuth.js v5 |
| Styling | Custom CSS (CSS variables, modular stylesheets) |
| State | Redux Toolkit (with RTK Query for data fetching) |
| File Storage | AWS S3 / Cloudflare R2 |
| Email | Resend |
| Payments | Stripe |
| Deployment | Vercel / Docker |

> ⚠️ **No Redis** — all caching and background jobs use PostgreSQL-based patterns (pg_notify, polling, materialized views).

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Next.js App Router               │
│  ┌─────────────┐  ┌────────────┐  ┌───────────┐  │
│  │  App Pages  │  │ API Routes │  │  Layouts  │  │
│  └─────────────┘  └────────────┘  └───────────┘  │
└───────────────────────┬─────────────────────────┘
                        │
              ┌─────────▼──────────┐
              │   Service Layer    │
              │  (Business Logic)  │
              └─────────┬──────────┘
                        │
              ┌─────────▼──────────┐
              │   Prisma ORM       │
              └─────────┬──────────┘
                        │
              ┌─────────▼──────────┐
              │   PostgreSQL DB    │
              │  (Multi-Tenant)    │
              └────────────────────┘
```

The app uses a **shared database, shared schema** multi-tenancy model. Every table has a `workspace_id` column and all queries are scoped to the current tenant.

---

## Features

### 🏢 Workspace & Tenancy
- Create unlimited workspaces per user
- Invite members via email with expiring tokens
- Role-based access: **Owner**, **Admin**, **Member**, **Guest**
- Per-workspace settings, branding, and billing

### 📋 Project Management
- Create **projects** with descriptions, deadlines, and status
- Organize with **boards** (Kanban-style columns)
- **Sprint planning** with start/end dates
- **Backlog** management
- Project **templates**

### ✅ Task Management
- Create tasks with **title**, **description**, **priority**, **due date**
- Assign to **one or multiple members**
- Add **labels/tags**, **checklists**, and **attachments**
- Task **dependencies** and blocking relationships
- **Sub-tasks** (parent-child hierarchy)
- **Time tracking** (estimated vs actual hours)

### 📊 Dashboards & Reports
- Per-workspace **activity feed**
- **Burndown charts** for sprints
- **Task completion** trends
- **Member workload** overview
- **Project progress** summaries

### 💬 Collaboration
- **Comments** on tasks with Markdown support
- **@Mentions** with in-app notifications
- **File attachments** via S3/R2
- **Real-time updates** via polling (no WebSockets required)

### 💳 Billing & Plans
- Stripe integration for **subscription management**
- **Free**, **Pro**, and **Business** plans
- Per-seat pricing model
- Usage limits enforced by plan

---

## Project Structure

```
saas-pm-system/
├── README.md                     ← You are here
├── package.json
├── tsconfig.json
├── next.config.ts
├── .env.example
│
├── prisma/
│   ├── schema.prisma             ← Full DB schema
│   ├── seed.ts                   ← Dev seed data
│   └── migrations/               ← Migration history
│
├── src/
│   ├── app/                      ← Next.js App Router
│   │   ├── (auth)/               ← Auth pages (login, register)
│   │   ├── (dashboard)/          ← Protected app pages
│   │   │   ├── [workspace]/      ← Workspace-scoped routes
│   │   │   │   ├── projects/
│   │   │   │   ├── tasks/
│   │   │   │   ├── members/
│   │   │   │   ├── settings/
│   │   │   │   └── billing/
│   │   ├── api/                  ← API route handlers
│   │   │   ├── auth/
│   │   │   ├── workspaces/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── members/
│   │   │   └── webhooks/
│   │   └── layout.tsx
│   │
│   ├── components/               ← React components
│   │   ├── ui/                   ← Custom UI primitives (buttons, inputs, cards, etc.)
│   │   ├── auth/                 ← Auth forms
│   │   ├── workspace/            ← Workspace UI
│   │   ├── project/              ← Project UI
│   │   ├── task/                 ← Task UI (board, list, detail)
│   │   ├── dashboard/            ← Dashboard widgets
│   │   └── shared/               ← Reusable components
│   │
│   ├── styles/                   ← Custom CSS
│   │   ├── globals.css           ← Global resets & base styles
│   │   ├── variables.css         ← CSS variables (design tokens)
│   │   └── components/           ← Per-component stylesheets
│   │
│   ├── store/                    ← Redux Toolkit store
│   │   ├── index.ts              ← Store configuration
│   │   ├── slices/                ← Feature slices (workspace, ui, etc.)
│   │   └── api/                  ← RTK Query API slices
│   │
│   ├── lib/                      ← Utilities & config
│   │   ├── db.ts                 ← Prisma client singleton
│   │   ├── auth.ts               ← NextAuth config
│   │   ├── stripe.ts             ← Stripe client
│   │   ├── s3.ts                 ← File upload helpers
│   │   ├── email.ts              ← Resend email helpers
│   │   └── utils.ts              ← General utilities
│   │
│   ├── server/                   ← Server-side logic
│   │   ├── api/                  ← tRPC or API helpers
│   │   ├── db/                   ← DB query helpers
│   │   └── services/             ← Business logic services
│   │       ├── workspace.service.ts
│   │       ├── project.service.ts
│   │       ├── task.service.ts
│   │       ├── member.service.ts
│   │       └── billing.service.ts
│   │
│   ├── hooks/                    ← Custom React hooks
│   ├── types/                    ← TypeScript type definitions
│   └── middleware.ts             ← Auth & tenant middleware
│
└── docs/
    ├── DATABASE.md               ← Schema & ERD
    ├── API.md                    ← API reference
    ├── AUTH.md                   ← Auth flows
    ├── MULTI_TENANCY.md          ← Tenancy model
    ├── BILLING.md                ← Stripe integration
    ├── DEPLOYMENT.md             ← Deploy guide
    └── CONTRIBUTING.md           ← Dev guide
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- pnpm (recommended) or npm

### 1. Clone & Install

```bash
git clone https://github.com/your-org/saas-pm-system.git
cd saas-pm-system
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
# Fill in required values — see docs/DEPLOYMENT.md
```

### 3. Database Setup

```bash
pnpm prisma migrate dev --name init
pnpm prisma db seed
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for the full list. Critical variables:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/saas_pm
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Database

See [docs/DATABASE.md](./docs/DATABASE.md) for the full schema and ERD.

Key tables: `users`, `workspaces`, `workspace_members`, `projects`, `boards`, `columns`, `tasks`, `comments`, `labels`, `sprints`, `notifications`, `subscriptions`.

---

## API Routes

See [docs/API.md](./docs/API.md) for the complete API reference.

Base path: `/api/v1/`

| Resource | Methods |
|---|---|
| `/workspaces` | GET, POST |
| `/workspaces/:id` | GET, PATCH, DELETE |
| `/workspaces/:id/members` | GET, POST, DELETE |
| `/projects` | GET, POST |
| `/projects/:id` | GET, PATCH, DELETE |
| `/tasks` | GET, POST |
| `/tasks/:id` | GET, PATCH, DELETE |
| `/tasks/:id/comments` | GET, POST |

---

## Authentication

See [docs/AUTH.md](./docs/AUTH.md).

Supported providers:
- **Email/Password** (credentials)
- **Google OAuth**
- **GitHub OAuth**
- **Magic Link** (email)

---

## Multi-Tenancy

See [docs/MULTI_TENANCY.md](./docs/MULTI_TENANCY.md).

Uses **shared schema** approach — every resource is scoped to a `workspaceId`. Middleware enforces workspace membership on every protected route.

---

## Contributing

See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md).

---

## License

MIT © 2024 Your Organization
