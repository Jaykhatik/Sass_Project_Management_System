# 🏢 Multi-Tenancy Model

This document explains the multi-tenant architecture of the SaaS Project Management System.

---

## Table of Contents

- [Strategy](#strategy)
- [Tenant Isolation](#tenant-isolation)
- [URL Structure](#url-structure)
- [Middleware Flow](#middleware-flow)
- [Server-Side Tenant Context](#server-side-tenant-context)
- [Database Query Pattern](#database-query-pattern)
- [Plan Limits Enforcement](#plan-limits-enforcement)
- [Cross-Tenant Security](#cross-tenant-security)

---

## Strategy

We use the **Shared Database, Shared Schema** model:

| Model | Pros | Cons |
|---|---|---|
| Separate DB per tenant | Best isolation | Complex ops, expensive |
| Separate schema per tenant | Good isolation | Migration complexity |
| **Shared schema** ✅ | Simple, scalable, cheap | Must enforce isolation in code |

Every table that holds tenant data has a `workspace_id` column and every query is filtered by it.

---

## Tenant Isolation

Isolation is enforced at **three layers**:

### Layer 1: Middleware (Route Level)

`src/middleware.ts` checks:
1. User is authenticated
2. The workspace slug in the URL corresponds to a real workspace
3. The user is a member of that workspace

Any failure results in a redirect or 403.

### Layer 2: Service Layer (Business Logic)

Every service function receives `workspaceId` explicitly and includes it in all Prisma queries. No function queries without it.

### Layer 3: Database (Indexes)

All foreign keys and indexes include `workspace_id` so even a bug that skips layers 1-2 would fail to find cross-tenant data efficiently (and row-level policies can be added for defense-in-depth).

---

## URL Structure

Workspaces are identified by **slug** in the URL:

```
https://app.example.com/[workspace-slug]/projects
https://app.example.com/[workspace-slug]/projects/[projectId]
https://app.example.com/[workspace-slug]/tasks/[taskId]
https://app.example.com/[workspace-slug]/settings
```

The workspace slug is resolved to a workspace ID in the layout server component, which is then passed down via React Context or passed to server components directly.

```
src/app/(dashboard)/
└── [workspace]/
    ├── layout.tsx           ← Resolves slug → workspace, verifies membership
    ├── page.tsx             ← Dashboard home
    ├── projects/
    ├── tasks/
    ├── members/
    ├── settings/
    └── billing/
```

---

## Middleware Flow

```
Request: GET /acme-corp/projects

1. middleware.ts
   ├── Check session → user is logged in?
   │     No → redirect /login
   │     Yes → continue
   │
   ├── Extract workspace slug "acme-corp" from pathname
   │
   └── Pass to Next.js routing

2. [workspace]/layout.tsx (Server Component)
   ├── Resolve slug "acme-corp" → workspaceId (DB query)
   │     Not found → 404
   │
   ├── Check workspace_members for (workspaceId, userId)
   │     Not member → redirect /dashboard (workspace picker)
   │
   ├── Set workspace context for child components
   └── Render children
```

---

## Server-Side Tenant Context

The workspace is resolved once in the layout and stored in a React cache (per request) for child Server Components:

```typescript
// src/lib/workspace-context.ts
import { cache } from "react";

export const getWorkspaceContext = cache(async (slug: string) => {
  const session = await getServerSession();
  if (!session) throw new AuthError();

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    include: {
      members: {
        where: { userId: session.user.id },
        take: 1,
      },
    },
  });

  if (!workspace || workspace.members.length === 0) {
    throw new NotFoundError("Workspace not found");
  }

  return {
    workspace,
    member: workspace.members[0],
    userId: session.user.id,
  };
});
```

---

## Database Query Pattern

### Always scope by workspaceId

```typescript
// src/server/services/task.service.ts

export async function getTasks(
  workspaceId: string,   // ← always first param
  filters: TaskFilters
) {
  return prisma.task.findMany({
    where: {
      workspaceId,       // ← always in where clause
      ...buildFilters(filters),
    },
    orderBy: { position: "asc" },
  });
}
```

### Never trust the client-provided workspaceId

```typescript
// ❌ WRONG — trusting user-supplied workspace
export async function getTask(req: Request) {
  const { workspaceId, taskId } = await req.json();
  return prisma.task.findUnique({ where: { id: taskId, workspaceId } });
}

// ✅ CORRECT — workspace from session/URL, not request body
export async function GET(
  req: Request,
  { params }: { params: { workspace: string; taskId: string } }
) {
  const { workspace: workspaceId, userId } = await getWorkspaceContext(params.workspace);
  return prisma.task.findUnique({
    where: { id: params.taskId, workspaceId },
  });
}
```

---

## Plan Limits Enforcement

Plan limits are checked in service functions before creating resources:

```typescript
// src/server/services/workspace.service.ts

const PLAN_LIMITS = {
  free:     { members: 5,  projects: 3,  storageGb: 1  },
  pro:      { members: 25, projects: 50, storageGb: 20 },
  business: { members: Infinity, projects: Infinity, storageGb: 100 },
} as const;

export async function enforceLimit(
  workspaceId: string,
  resource: "members" | "projects",
) {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    include: { subscription: true },
  });

  const plan = workspace.subscription?.plan ?? "free";
  const limit = PLAN_LIMITS[plan][resource];

  const count = await getResourceCount(workspaceId, resource);
  if (count >= limit) {
    throw new PlanLimitError(
      `Your ${plan} plan allows up to ${limit} ${resource}. Upgrade to add more.`
    );
  }
}
```

---

## Cross-Tenant Security

### Common attack vectors and mitigations

**IDOR (Insecure Direct Object Reference)**

Attacker changes `taskId` in URL to access another tenant's task.

Mitigation: Every query includes `workspaceId`:
```typescript
prisma.task.findUnique({
  where: { id: taskId, workspaceId }  // returns null if IDs don't match
})
```

**Workspace enumeration**

Attacker tries to discover workspace slugs.

Mitigation: Slug existence is not revealed unless user is a member. 404 is returned for both "not found" and "not a member" cases.

**Invitation token abuse**

Attacker uses an old or stolen invitation token.

Mitigation: Tokens are one-time use, expire in 48 hours, and are stored hashed.

**Member escalation**

Member tries to promote themselves to admin.

Mitigation: Role changes require `admin` or `owner` role, checked in `requireWorkspaceMember()` with `minimumRole: "admin"`.
