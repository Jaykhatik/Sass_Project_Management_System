# 🗄️ Database — Schema & ERD

This document describes the full PostgreSQL database schema for the SaaS Project Management System.

---

## Table of Contents

- [Overview](#overview)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Tables Reference](#tables-reference)
- [Indexes & Performance](#indexes--performance)
- [Multi-Tenancy Pattern](#multi-tenancy-pattern)
- [Migrations](#migrations)
- [Seeding](#seeding)

---

## Overview

- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Schema model**: Shared database, shared schema (all rows scoped by `workspaceId`)
- **No Redis** — background jobs and cache use PostgreSQL materialized views, `pg_notify`, and scheduled queries

---

## Entity Relationship Diagram

```
users
  │
  ├─── workspace_members ───── workspaces
  │                                │
  │                          ┌─────┴──────┐
  │                       projects    subscriptions
  │                          │
  │                    ┌─────┴──────┐
  │                  boards       sprints
  │                    │
  │                 columns
  │                    │
  │                  tasks ──────── task_assignees
  │                    │                │
  │               ┌────┴────┐        users
  │            comments  attachments
  │               │
  │            mentions
  │               │
  │            users
  │
  └─── notifications
```

---

## Tables Reference

### `users`

Stores all registered users across all workspaces.

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT,
  avatar_url    TEXT,
  password_hash TEXT,              -- NULL for OAuth-only users
  email_verified BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### `accounts`

OAuth provider accounts linked to a user (NextAuth.js pattern).

```sql
CREATE TABLE accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider            TEXT NOT NULL,      -- "google", "github"
  provider_account_id TEXT NOT NULL,
  access_token        TEXT,
  refresh_token       TEXT,
  expires_at          BIGINT,
  token_type          TEXT,
  scope               TEXT,
  id_token            TEXT,
  UNIQUE(provider, provider_account_id)
);
```

### `sessions`

```sql
CREATE TABLE sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires       TIMESTAMPTZ NOT NULL
);
```

### `workspaces`

Each workspace is a tenant. Users can belong to many workspaces.

```sql
CREATE TABLE workspaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,   -- used in URL: /ws/my-company
  logo_url    TEXT,
  owner_id    UUID NOT NULL REFERENCES users(id),
  plan        TEXT NOT NULL DEFAULT 'free',  -- free | pro | business
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `workspace_members`

Junction table for users ↔ workspaces with roles.

```sql
CREATE TABLE workspace_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member', -- owner | admin | member | guest
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  invited_by   UUID REFERENCES users(id),
  UNIQUE(workspace_id, user_id)
);
```

### `invitations`

Pending workspace invitations sent by email.

```sql
CREATE TABLE invitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'member',
  token        TEXT UNIQUE NOT NULL,
  invited_by   UUID NOT NULL REFERENCES users(id),
  expires_at   TIMESTAMPTZ NOT NULL,
  accepted_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `projects`

Projects belong to a workspace and contain boards/sprints.

```sql
CREATE TABLE projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'active', -- active | archived | completed
  color        TEXT DEFAULT '#6366F1',
  icon         TEXT,
  start_date   DATE,
  due_date     DATE,
  created_by   UUID NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `boards`

A project can have multiple boards (e.g., "Development", "Design").

```sql
CREATE TABLE boards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  is_default   BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `columns`

Kanban columns within a board.

```sql
CREATE TABLE columns (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id     UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  position     INTEGER NOT NULL DEFAULT 0,
  color        TEXT,
  is_done_col  BOOLEAN DEFAULT FALSE,  -- marks tasks as "complete"
  task_limit   INTEGER,                -- WIP limit (NULL = unlimited)
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `tasks`

Core entity. Tasks live in a column and optionally a sprint.

```sql
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  board_id        UUID NOT NULL REFERENCES boards(id),
  column_id       UUID NOT NULL REFERENCES columns(id),
  sprint_id       UUID REFERENCES sprints(id),
  parent_task_id  UUID REFERENCES tasks(id),         -- sub-tasks
  title           TEXT NOT NULL,
  description     TEXT,
  priority        TEXT NOT NULL DEFAULT 'medium',    -- critical | high | medium | low | none
  status          TEXT NOT NULL DEFAULT 'todo',      -- todo | in_progress | in_review | done
  position        INTEGER NOT NULL DEFAULT 0,
  due_date        TIMESTAMPTZ,
  start_date      TIMESTAMPTZ,
  estimated_hours DECIMAL(6,2),
  actual_hours    DECIMAL(6,2),
  story_points    INTEGER,
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### `task_assignees`

A task can be assigned to multiple users.

```sql
CREATE TABLE task_assignees (
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  PRIMARY KEY (task_id, user_id)
);
```

### `task_dependencies`

Block/blocked-by relationships between tasks.

```sql
CREATE TABLE task_dependencies (
  blocker_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  blocked_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (blocker_task_id, blocked_task_id),
  CHECK (blocker_task_id != blocked_task_id)
);
```

### `labels`

Reusable labels per workspace.

```sql
CREATE TABLE labels (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  color        TEXT NOT NULL DEFAULT '#94A3B8',
  UNIQUE(workspace_id, name)
);
```

### `task_labels`

```sql
CREATE TABLE task_labels (
  task_id  UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);
```

### `sprints`

Time-boxed iterations in a project.

```sql
CREATE TABLE sprints (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  goal         TEXT,
  status       TEXT NOT NULL DEFAULT 'planned',  -- planned | active | completed
  start_date   DATE,
  end_date     DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `comments`

Comments on tasks, supporting Markdown and @mentions.

```sql
CREATE TABLE comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES users(id),
  content      TEXT NOT NULL,
  is_edited    BOOLEAN DEFAULT FALSE,
  parent_id    UUID REFERENCES comments(id),  -- threaded replies
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `attachments`

Files attached to tasks, stored in S3/R2.

```sql
CREATE TABLE attachments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  uploaded_by  UUID NOT NULL REFERENCES users(id),
  filename     TEXT NOT NULL,
  file_url     TEXT NOT NULL,
  file_size    BIGINT,
  mime_type    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `notifications`

In-app notifications (no Redis — polled via RTK Query).

```sql
CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,  -- task_assigned | comment_added | mention | sprint_started ...
  title        TEXT NOT NULL,
  body         TEXT,
  data         JSONB,          -- arbitrary context (taskId, commentId, etc.)
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `activity_logs`

Immutable audit trail of all workspace events.

```sql
CREATE TABLE activity_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_id     UUID REFERENCES users(id),
  entity_type  TEXT NOT NULL,   -- task | project | sprint | member ...
  entity_id    UUID NOT NULL,
  action       TEXT NOT NULL,   -- created | updated | deleted | moved ...
  before_data  JSONB,
  after_data   JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `subscriptions`

Stripe subscription data per workspace.

```sql
CREATE TABLE subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_customer_id   TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan                 TEXT NOT NULL DEFAULT 'free',
  status               TEXT NOT NULL DEFAULT 'active',  -- active | canceled | past_due | trialing
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Indexes & Performance

```sql
-- Workspace scoping (most critical — on every query)
CREATE INDEX idx_projects_workspace    ON projects(workspace_id);
CREATE INDEX idx_tasks_workspace       ON tasks(workspace_id);
CREATE INDEX idx_tasks_project         ON tasks(project_id);
CREATE INDEX idx_tasks_column          ON tasks(column_id);
CREATE INDEX idx_tasks_sprint          ON tasks(sprint_id);
CREATE INDEX idx_tasks_parent          ON tasks(parent_task_id);
CREATE INDEX idx_comments_task         ON comments(task_id);
CREATE INDEX idx_notifications_user    ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_activity_logs_entity  ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_ws      ON activity_logs(workspace_id, created_at DESC);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

-- Full-text search on tasks
CREATE INDEX idx_tasks_fts ON tasks USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

---

## Multi-Tenancy Pattern

Every service query **must** include `workspaceId`:

```typescript
// ✅ Correct — always scope by workspaceId
const tasks = await prisma.task.findMany({
  where: {
    workspaceId: session.workspaceId,
    projectId: params.projectId,
  },
});

// ❌ Never query without workspace scope
const tasks = await prisma.task.findMany({
  where: { projectId: params.projectId },
});
```

Middleware in `src/middleware.ts` validates the user's membership in the current workspace on every request.

---

## Migrations

```bash
# Create a new migration
pnpm prisma migrate dev --name describe_your_change

# Apply migrations in production
pnpm prisma migrate deploy

# Reset database (dev only)
pnpm prisma migrate reset

# View migration status
pnpm prisma migrate status
```

---

## Seeding

The seed file creates:
- 2 demo users
- 1 workspace with members
- 2 projects with boards, columns, and tasks
- Sample sprints, labels, and comments

```bash
pnpm prisma db seed
```

Seed file: `prisma/seed.ts`
