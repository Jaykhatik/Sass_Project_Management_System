# 🤝 Contributing Guide

Welcome! This document covers how to set up your development environment and contribute to the project.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Project Structure Guide](#project-structure-guide)
- [Development Workflow](#development-workflow)
- [Code Style & Conventions](#code-style--conventions)
- [TypeScript Patterns](#typescript-patterns)
- [Writing API Routes](#writing-api-routes)
- [Writing Service Functions](#writing-service-functions)
- [Writing Tests](#writing-tests)
- [Pull Request Process](#pull-request-process)

---

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (`npm install -g pnpm`)
- **PostgreSQL** 15+ running locally
- **Git**

---

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-org/saas-pm-system.git
cd saas-pm-system

# 2. Install dependencies
pnpm install

# 3. Copy environment file
cp .env.example .env.local

# 4. Create a local PostgreSQL database
createdb saas_pm_dev

# 5. Update DATABASE_URL in .env.local
# DATABASE_URL=postgresql://localhost:5432/saas_pm_dev

# 6. Run migrations
pnpm prisma migrate dev

# 7. Seed the database
pnpm prisma db seed

# 8. Start the dev server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000).

**Demo credentials after seeding:**
- Email: `demo@example.com` / Password: `Demo1234!`
- Workspace slug: `demo-workspace`

---

## Project Structure Guide

### Where does my code go?

| What you're building | Where |
|---|---|
| New page | `src/app/(dashboard)/[workspace]/your-page/page.tsx` |
| New API endpoint | `src/app/api/v1/resource/route.ts` |
| Business logic | `src/server/services/resource.service.ts` |
| DB query helper | `src/server/db/resource.queries.ts` |
| Reusable UI component | `src/components/shared/` |
| Feature-specific component | `src/components/feature-name/` |
| Custom React hook | `src/hooks/use-feature.ts` |
| TypeScript types | `src/types/resource.types.ts` |
| Utility function | `src/lib/utils.ts` (or new file in `src/lib/`) |

---

## Development Workflow

### Branching

```
main           ← production-ready code
develop        ← integration branch
feature/xxx    ← new features
fix/xxx        ← bug fixes
chore/xxx      ← maintenance
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add task dependency visualization
fix: resolve column reorder position bug
chore: upgrade prisma to 5.10
docs: update API reference for sprints
refactor: extract task filter logic to service layer
```

### Useful Commands

```bash
pnpm dev                        # Start dev server
pnpm build                      # Production build
pnpm lint                       # ESLint
pnpm type-check                 # TypeScript check (no emit)
pnpm test                       # Run tests (Vitest)
pnpm test:e2e                   # Playwright e2e tests

pnpm prisma studio              # Visual DB editor
pnpm prisma migrate dev         # Create migration
pnpm prisma migrate reset       # Reset DB (dev only!)
pnpm prisma db seed             # Re-seed
```

---

## Code Style & Conventions

- **Formatter**: Prettier (auto-runs on save via VS Code config)
- **Linter**: ESLint with `@typescript-eslint`
- **Imports**: Absolute paths via `@/` alias (e.g., `import { prisma } from "@/lib/db"`)
- **Component files**: PascalCase (`TaskCard.tsx`)
- **Everything else**: camelCase (`taskService.ts`, `useTaskFilters.ts`)
- **Types/Interfaces**: PascalCase with no `I` prefix (`interface TaskFilters`, not `ITaskFilters`)

---

## TypeScript Patterns

### API Route Handler

```typescript
// src/app/api/v1/tasks/[taskId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getTask } from "@/server/services/task.service";
import { getWorkspaceContext } from "@/lib/workspace-context";

interface RouteParams {
  params: { workspace: string; taskId: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { workspace, userId } = await getWorkspaceContext(params.workspace);

  const task = await getTask(workspace.id, params.taskId);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { workspace, member } = await getWorkspaceContext(params.workspace);

  const body = await req.json();
  
  // Validate input manually
  if (
    body.title !== undefined &&
    (typeof body.title !== "string" || body.title.length === 0 || body.title.length > 500)
  ) {
    return NextResponse.json({ error: "Title must be between 1 and 500 characters" }, { status: 400 });
  }

  const task = await updateTask(workspace.id, params.taskId, body);
  return NextResponse.json(task);
}
```

### Service Function

```typescript
// src/server/services/task.service.ts
import { prisma } from "@/lib/db";
import { AppError, NotFoundError } from "@/lib/errors";
import type { Task, UpdateTaskInput } from "@/types/task.types";

export async function updateTask(
  workspaceId: string,
  taskId: string,
  data: UpdateTaskInput
): Promise<Task> {
  // Always verify the task belongs to this workspace
  const existing = await prisma.task.findUnique({
    where: { id: taskId, workspaceId },
  });

  if (!existing) throw new NotFoundError("Task not found");

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  // Log activity
  await logActivity(workspaceId, "task", taskId, "updated", existing, updated);

  return updated;
}
```

### Custom Error Classes

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR"
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class PlanLimitError extends AppError {
  constructor(message: string) {
    super(message, 402, "PLAN_LIMIT_EXCEEDED");
  }
}
```

---

## Writing API Routes

1. **Validate input** before touching the database
2. **Use workspace context** — never trust client-provided workspaceId
3. **Return consistent error shapes** `{ error: string, code: string }`
4. **Handle AppErrors** from services and map to HTTP codes

```typescript
// Global error handler pattern in routes
try {
  const result = await someService(workspace.id, input);
  return NextResponse.json(result);
} catch (err) {
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.statusCode }
    );
  }
  console.error("Unhandled error:", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

---

## Writing Service Functions

- **Always** accept `workspaceId` as the first parameter
- **Always** include `workspaceId` in all Prisma queries
- **Throw** `AppError` subclasses, never return error objects
- Log activity for significant mutations

---

## Writing Tests

We use **Vitest** for unit/integration tests and **Playwright** for e2e.

```bash
# Run unit tests
pnpm test

# Run specific file
pnpm test src/server/services/task.service.test.ts

# Run e2e tests
pnpm test:e2e
```

### Test file location

- Unit/integration tests: co-located as `*.test.ts` next to the file
- E2e tests: `tests/e2e/*.spec.ts`

### Example service test

```typescript
// src/server/services/task.service.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createTask, getTask } from "./task.service";
import { createTestWorkspace, createTestUser } from "@/tests/helpers";

describe("task.service", () => {
  let workspaceId: string;
  let projectId: string;
  let userId: string;

  beforeEach(async () => {
    ({ workspaceId, userId } = await createTestWorkspace());
    // setup project...
  });

  it("creates a task with correct workspace scope", async () => {
    const task = await createTask(workspaceId, projectId, userId, {
      title: "Test task",
      columnId: "...",
    });

    expect(task.workspaceId).toBe(workspaceId);
    expect(task.title).toBe("Test task");
  });
});
```

---

## Pull Request Process

1. Branch off `develop`: `git checkout -b feature/my-feature develop`
2. Make changes, write tests
3. `pnpm lint && pnpm type-check && pnpm test`
4. Push and open a PR against `develop`
5. Fill out the PR template
6. Request review from at least one team member
7. Squash merge after approval

### PR Title Format

Same as commit message format: `feat: ...`, `fix: ...`, etc.
