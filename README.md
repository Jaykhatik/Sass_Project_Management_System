# 🚀 SaaS Project Management System

A full-featured, multi-tenant SaaS Project Management platform — like a lighter version of Jira — built with **Next.js**, **PostgreSQL**, **Prisma ORM**, and **TypeScript**.

---

## 🧠 How This Project Works (Simple Overview)

Read this first. It explains the whole system in plain words.

### What is this?

Multiple completely separate companies (called **tenants**) can each have their own account. Each company signs up, gets their own **workspace**, invites their team, and manages all their projects and tasks. They never see each other's data.

---

### 🧱 The 4 Core Building Blocks

#### 1. The Database (PostgreSQL + Prisma)
The filing cabinet. Everything is stored here — users, teams, projects, tasks, comments, files.

Every single piece of data has a `workspaceId` stamp on it (like a Post-it note saying *"this belongs to Acme Corp only"*). Even if a hacker tried to fetch someone else's task by guessing its ID, the query would fail because the `workspaceId` wouldn't match.

```
User signs up → creates a Workspace → invites Members → creates Projects → creates Tasks
```

#### 2. The Backend (Next.js API Routes + Service Layer)
When the browser needs data, it calls an API like `GET /api/v1/workspaces/123/tasks`. The API layer:
- Checks: **Are you logged in?**
- Checks: **Are you a member of this workspace?**
- Calls the **Service Layer** (business logic) to fetch data from Prisma
- Returns a JSON response

The Service Layer is the middleman — API routes handle HTTP, services handle "what actually happens."

#### 3. The Frontend (Next.js Pages + React + Redux)
The browser receives data and displays it. Split into two types:
- **Server Components** — run on the server, fetch data from Prisma directly, send finished HTML. Fast and secure.
- **Client Components** — run in the browser, handle clicks, animations, drag-and-drop. Need `'use client'` at the top.

**Redux** acts as shared memory between UI parts. For example, clicking the hamburger button in the Header tells the Sidebar to open — even though they are completely separate components.

#### 4. The Auth System (NextAuth.js)
Before seeing anything, users must log in. Login options:
- **Email + Password** (must verify email first)
- **Google OAuth**
- **GitHub OAuth**
- **Magic Link** (one-time code via email)

A login creates a **Session** row in the database. That session is checked on every request via middleware before any page loads.

---

### 🚪 The Journey of a Single Request

A user visits `https://app.example.com/acme-corp/projects`:

```
1. Browser sends request
        │
        ▼
2. middleware.ts runs first
   ├── Are you logged in? → No → redirect to /login
   └── Yes → continue
        │
        ▼
3. Dashboard layout runs (Server Component)
   ├── Takes "acme-corp" from the URL
   ├── Asks Prisma: does this workspace exist?
   ├── Asks Prisma: is this user a member?
   ├── Not found / not member → 404 page
   └── Yes → render Sidebar + Header + page content
        │
        ▼
4. projects/page.tsx runs
   ├── Fetches projects WHERE workspaceId = acme-corp's ID
   └── Returns the list as a styled UI
```

---

### 💳 How Money Works (Stripe Billing)

3 plans: **Free**, **Pro** ($12/seat/mo), **Business** ($24/seat/mo).

When a workspace owner upgrades:
1. Our server creates a **Stripe Checkout session** → redirects user to Stripe
2. User pays securely on Stripe's page
3. Stripe fires a **webhook** to our server: *"Payment completed!"*
4. Our server updates the `subscriptions` table in PostgreSQL
5. Plan limits instantly expand

When the Free plan limit (3 projects) is hit → the service throws a `PlanLimitError` → UI shows an upgrade prompt.

---

### 🔐 How Security Works

**The Golden Rule:** Every database query ALWAYS includes the workspace ID — taken from the verified session, never from the user's request body.

**Roles inside a workspace:**

| Role | What They Can Do |
|---|---|
| `owner` | Full control, billing, delete workspace |
| `admin` | Manage members and settings |
| `member` | Create and edit tasks/projects |
| `guest` | Read-only — can view but not change anything |

---

### 🗺️ Full User Journey End-to-End

```
New user discovers the app
        │
        ▼
Register with email → verify email → log in
        │
        ▼
Create a Workspace (slug: "my-company")
URL becomes: /my-company/dashboard
        │
        ▼
Invite teammates by email
They click the link → become members
        │
        ▼
Create a Project → Board created automatically
Board has 4 columns: To Do / In Progress / Review / Done
        │
        ▼
Create Tasks → assign to people → set priorities, due dates
Drag tasks between columns on the Kanban board
        │
        ▼
Team collaborates via Comments + @Mentions → get Notifications
Attach files to tasks (stored in AWS S3 or Cloudflare R2)
        │
        ▼
Manager creates Sprints → plan 2-week work chunks
Track progress with Burndown Charts
        │
        ▼
Workspace grows past 3 projects → Free plan limit hit
Owner upgrades to Pro via Stripe → limits expand immediately
        │
        ▼
App deployed to Vercel / Docker in production
All data stays in PostgreSQL — no Redis needed
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm or pnpm

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp Saas_Project_Management_System_Readme/.env.example .env.local
# Fill in DATABASE_URL, NEXTAUTH_SECRET, etc.
```

### 3. Set up the database
```bash
npx prisma migrate dev --name init   # Create all tables
npx prisma db seed                   # Fill with demo data
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/dashboard` automatically.

---

## 📁 Key Files to Know

| File | What It Does |
|---|---|
| `prisma/schema.prisma` | All 17 database table definitions |
| `prisma/seed.ts` | Demo data (users, workspace, tasks) |
| `prisma.config.ts` | Database connection config (Prisma v7) |
| `src/app/layout.tsx` | Root HTML wrapper, Redux Provider |
| `src/app/(dashboard)/dashboard/layout.tsx` | Dashboard shell (Sidebar + Header) |
| `src/app/(dashboard)/dashboard/page.tsx` | Dashboard home page |
| `src/components/shared/Sidebar.tsx` | Sidebar with nav, logout, mobile drawer |
| `src/components/shared/Header.tsx` | Top header with search and hamburger |
| `src/store/index.ts` | Redux store setup |
| `src/store/slices/uiSlice.ts` | UI state (sidebar open/closed, theme) |
| `src/store/slices/workspaceSlice.ts` | Current workspace state |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/lib/errors.ts` | Custom error classes (NotFoundError, etc.) |

---

## 📚 Full Documentation

All detailed docs are in `Saas_Project_Management_System_Readme/`:

| File | Topic |
|---|---|
| `README.md` | Full technical overview |
| `PHASES.md` | Development roadmap (all phases) |
| `DATABASE.md` | Full schema and ERD |
| `API.md` | Complete API reference |
| `AUTH.md` | Authentication flows |
| `MULTI_TENANCY.md` | How tenant isolation works |
| `BILLING.md` | Stripe integration guide |
| `DEPLOYMENT.md` | Production deployment guide |
| `CONTRIBUTING.md` | Developer guide and code standards |

Phase-specific READMEs are in `Packages_Readme_files_EXPLANATIONS/PHASES_README_FILES/`:

| File | Topic |
|---|---|
| `PHASE2-DATABASE-PRISMA.md` | How Prisma, models, migrations, and seeding work |
| `PHASE3-UI-SHELL-LAYOUT.md` | How routing, layouts, Redux, and the sidebar work |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma v7 |
| Auth | NextAuth.js v5 (coming in Phase 14) |
| Styling | Tailwind CSS + shadcn/ui |
| State | Redux Toolkit |
| File Storage | AWS S3 / Cloudflare R2 (coming later) |
| Email | Resend (coming later) |
| Payments | Stripe (coming later) |
| Deployment | Vercel / Docker |

---

## 📋 Development Progress

| Phase | Description | Status |
|---|---|---|
| 1 | Project Setup & Tooling | ✅ Complete |
| 2 | Database Schema & Prisma | ✅ Complete |
| 3 | Core UI Shell & Layout | ✅ Complete |
| 4 | Workspace Management | 🔄 Next |
| 5 | Project Management | ⬜ Pending |
| 6 | Kanban Board | ⬜ Pending |
| 7 | Task Management | ⬜ Pending |
| 8 | Sprint Management | ⬜ Pending |
| 9 | Comments & Attachments | ⬜ Pending |
| 10 | Notifications | ⬜ Pending |
| 11 | Search | ⬜ Pending |
| 12 | Analytics & Dashboards | ⬜ Pending |
| 13 | Billing (Stripe) | ⬜ Pending |
| 14 | Authentication | ⬜ Pending |
| 15 | Deployment | ⬜ Pending |
