# 🗄️ Phase 2 — Database Schema & Prisma (Full Guide)

A complete, beginner-friendly explanation of how we set up the database for this SaaS Project Management System.

---

## 🧠 The Big Picture (Before You Read Anything)

Think of it like building a **filing cabinet system** for your app:

| Step | Analogy | Command/File |
|---|---|---|
| 1. Design the drawers | Draw a blueprint | `schema.prisma` |
| 2. Build the cabinet | Apply blueprint to real DB | `prisma migrate dev` |
| 3. Get the key to open it | Generate TypeScript types | `prisma generate` |
| 4. Put starter files inside | Fill with demo data | `prisma db seed` |

---

## Step 1 — What is a "Model" and why do we write them?

A **model** in Prisma is just a description of a database table written in a special syntax. Instead of writing raw SQL like:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT
);
```

We write it in `prisma/schema.prisma` in a much simpler way:

```prisma
model User {
  id    String @id @default(uuid()) @db.Uuid
  email String @unique
  name  String?
}
```

Prisma then **converts this into SQL automatically**. You never have to write SQL manually.

### Why models matter:
- Every model = one table in your PostgreSQL database
- The fields inside = columns in that table
- The `@relation` decorators = foreign keys (links between tables)

---

## Step 2 — Our Full Schema (What We Built)

We defined **17 models** in `prisma/schema.prisma`, all based on the `DATABASE.md` documentation:

```
User          → All registered users across all workspaces
Account       → OAuth logins (Google, GitHub) linked to a user
Session       → Active login sessions
Workspace     → A "company/team" tenant (the top-level entity)
WorkspaceMember → Which users belong to which workspace & their role
Invitation    → Pending email invites to join a workspace
Project       → A project inside a workspace
Board         → A Kanban board inside a project
Column        → A column on the board (To Do, In Progress, Done)
Task          → The core card/item on the board
TaskAssignee  → Which users are assigned to which tasks
TaskDependency → "This task blocks that task" relationships
Label         → Coloured tags per workspace
TaskLabel     → Which labels are on which tasks
Sprint        → Time-boxed work iterations (Agile sprints)
Comment       → Comments on tasks (with threaded replies)
Attachment    → Files attached to tasks
Notification  → In-app notifications
ActivityLog   → Immutable audit trail of all changes
Subscription  → Stripe billing data per workspace
```

### The Critical Pattern — Multi-Tenancy

Every single model (except `User`, `Account`, `Session`) has a `workspaceId` field. This means all data is **always scoped** to a specific workspace. No user can accidentally see another company's data:

```typescript
// ✅ ALWAYS do this — scoped query
const tasks = await prisma.task.findMany({
  where: {
    workspaceId: currentWorkspace.id, // 🔑 The key
    projectId: params.projectId,
  }
});

// ❌ NEVER do this — unscoped query (security hole!)
const tasks = await prisma.task.findMany({
  where: { projectId: params.projectId }
});
```

---

## Step 3 — What is `prisma.config.ts`?

In **Prisma v7**, configuration was moved out of `schema.prisma` and into a separate file called `prisma.config.ts` in your project root.

```typescript
// prisma.config.ts
import { defineConfig } from "prisma/config";

export default defineConfig({
  migrations: {
    seed: 'npx tsx prisma/seed.ts', // Tells Prisma how to run your seed file
  },
  datasource: {
    url: process.env.DATABASE_URL,   // Your database connection string
  },
});
```

This file tells Prisma:
1. **Where your database is** (`DATABASE_URL` from `.env`)
2. **How to seed it** (what command to run)

---

## Step 4 — What is `prisma migrate dev`?

This is the most important command. It does **3 things at once**:

1. **Reads** your `schema.prisma` models
2. **Compares** them to what's currently in your database
3. **Generates an SQL file** showing what needs to change, and **applies it** to the database

```bash
npx prisma migrate dev --name init
```

After running this, a new folder appears:
```
prisma/
└── migrations/
    └── 20260615050205_init/
        └── migration.sql   ← The actual SQL that was run
```

You should **commit this folder to Git**. It's the history of all changes to your database schema.

> ⚠️ **Prisma v7 Note:** You must have your `DATABASE_URL` set in your `.env` file and `prisma.config.ts` correctly configured before running this command.

---

## Step 5 — What is `prisma generate`?

After running a migration (or after changing your schema), you run:

```bash
npx prisma generate
```

This scans your `schema.prisma` and **auto-generates TypeScript types** in `node_modules/@prisma/client`.

After generating, you get full TypeScript autocomplete:

```typescript
import { prisma } from "@/lib/db";

// TypeScript knows EXACTLY what fields exist!
const task = await prisma.task.create({
  data: {
    title: "My Task",    // ✅ String - TypeScript confirms this
    priority: "high",    // ✅ String - TypeScript confirms this
    wrongField: "oops",  // ❌ TypeScript ERROR - field doesn't exist
  }
});
```

> **Note:** `prisma migrate dev` automatically runs `prisma generate` for you. You only need to run it manually if you change the schema without migrating.

---

## Step 6 — What is `src/lib/db.ts`?

We created this file as the **single Prisma client instance** for the whole app:

```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => new PrismaClient();

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
export { prisma };

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
```

### Why this pattern?

In **Next.js development mode**, the server hot-reloads constantly. Without this pattern, each reload would create a **new database connection**, eventually exhausting your PostgreSQL connection pool (PostgreSQL allows a maximum of ~100 connections by default).

This pattern stores the client on the `global` object so it is **reused** across hot reloads. In production, a fresh client is always created once on startup.

---

## Step 7 — Why do we create a Seed File?

The seed file (`prisma/seed.ts`) **populates your database with starter data** so you can immediately see and test your app without starting from an empty screen.

### Without seeding:
- App loads → Everything is empty → Nothing to see or test ❌

### With seeding:
- App loads → Demo workspace, projects, tasks already exist → You can test immediately ✅

Our seed creates:
```
👤 Demo User (demo@example.com)
👤 Alice (alice@example.com)
  │
  └── 🏢 Demo Workspace
        │
        └── 📁 Website Redesign (Project)
              │
              └── 📋 Main Board
                    ├── 📌 To Do
                    │     └── ✅ Task: "Design new landing page"
                    ├── 🔄 In Progress
                    │     └── ✅ Task: "Setup Next.js Project"
                    ├── 👀 Review
                    └── ✔️  Done
```

### Why we use the `PrismaPg` adapter in the seed:

In Prisma v7, the normal `new PrismaClient()` doesn't know the database URL when running outside of the Next.js context (like in a standalone script). We have to pass a **driver adapter** directly:

```typescript
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

This connects the seed script directly to PostgreSQL.

---

## 📋 Quick Command Reference

```bash
# ──────────────────────────────────────────────────────────
# 🔁 FULL RESET & REBUILD (use when starting fresh)
# ──────────────────────────────────────────────────────────

npx prisma migrate reset            # ⚠️ Drops ALL data, re-runs all migrations

# ──────────────────────────────────────────────────────────
# 🏗️  APPLY SCHEMA CHANGES (use every time you edit schema.prisma)
# ──────────────────────────────────────────────────────────

npx prisma migrate dev --name <description>   # Create + apply migration
npx prisma generate                           # Regenerate TypeScript types

# ──────────────────────────────────────────────────────────
# 🌱 SEED DATABASE (fill with demo data)
# ──────────────────────────────────────────────────────────

npx prisma db seed                  # Runs prisma/seed.ts

# ──────────────────────────────────────────────────────────
# 🔍 INSPECT & DEBUG
# ──────────────────────────────────────────────────────────

npx prisma studio                   # Opens a visual database browser at localhost:5555
npx prisma migrate status           # Shows which migrations have been applied
npx prisma format                   # Auto-formats schema.prisma

# ──────────────────────────────────────────────────────────
# 🚀 PRODUCTION DEPLOY (never use migrate dev in production!)
# ──────────────────────────────────────────────────────────

npx prisma migrate deploy           # Applies pending migrations (no prompt, safe for CI/CD)
```

---

## ✅ Phase 2 Completion Checklist

- [x] `prisma/schema.prisma` — All 17 models defined
- [x] `prisma.config.ts` — Database URL and seed command configured
- [x] `src/lib/db.ts` — Singleton Prisma client created
- [x] `prisma/seed.ts` — Demo data seeding script written
- [x] Migration applied — Tables exist in PostgreSQL
- [x] Database seeded — Demo data populated
