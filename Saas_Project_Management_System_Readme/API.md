# 📡 API Reference

All API routes are under `/api/v1/`. Requests to protected routes require a valid session cookie (set by NextAuth.js).

All responses are JSON. Errors follow the shape:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE"
}
```

---

## Table of Contents

- [Authentication](#authentication)
- [Workspaces](#workspaces)
- [Members](#members)
- [Invitations](#invitations)
- [Projects](#projects)
- [Boards & Columns](#boards--columns)
- [Tasks](#tasks)
- [Comments](#comments)
- [Labels](#labels)
- [Sprints](#sprints)
- [Attachments](#attachments)
- [Notifications](#notifications)
- [Activity Logs](#activity-logs)
- [Billing](#billing)
- [Webhooks](#webhooks)

---

## Authentication

> See [AUTH.md](./AUTH.md) for the full auth flow.

### `POST /api/auth/register`

Register a new user.

**Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass123!"
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "name": "Jane Smith",
  "email": "jane@example.com"
}
```

---

### `POST /api/auth/signin`

Sign in (handled by NextAuth.js at `/api/auth/[...nextauth]`).

---

## Workspaces

### `GET /api/v1/workspaces`

List all workspaces the current user is a member of.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "logoUrl": null,
    "plan": "pro",
    "role": "owner"
  }
]
```

---

### `POST /api/v1/workspaces`

Create a new workspace. The creator becomes the **owner**.

**Body:**
```json
{
  "name": "My Startup",
  "slug": "my-startup"
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "name": "My Startup",
  "slug": "my-startup",
  "plan": "free"
}
```

---

### `GET /api/v1/workspaces/:workspaceId`

Get workspace details.

**Response `200`:**
```json
{
  "id": "uuid",
  "name": "My Startup",
  "slug": "my-startup",
  "logoUrl": null,
  "plan": "free",
  "memberCount": 4,
  "projectCount": 3
}
```

---

### `PATCH /api/v1/workspaces/:workspaceId`

Update workspace settings. Requires **Admin** or **Owner**.

**Body (all fields optional):**
```json
{
  "name": "New Name",
  "logoUrl": "https://..."
}
```

---

### `DELETE /api/v1/workspaces/:workspaceId`

Delete workspace and all data. Requires **Owner** only.

---

## Members

### `GET /api/v1/workspaces/:workspaceId/members`

List workspace members.

**Response `200`:**
```json
[
  {
    "userId": "uuid",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "avatarUrl": null,
    "role": "admin",
    "joinedAt": "2024-01-15T10:00:00Z"
  }
]
```

---

### `PATCH /api/v1/workspaces/:workspaceId/members/:userId`

Change a member's role. Requires **Admin** or **Owner**.

**Body:**
```json
{
  "role": "admin"
}
```

---

### `DELETE /api/v1/workspaces/:workspaceId/members/:userId`

Remove a member from the workspace. Requires **Admin** or **Owner**.

---

## Invitations

### `POST /api/v1/workspaces/:workspaceId/invitations`

Invite a user by email. Sends an email with an accept link.

**Body:**
```json
{
  "email": "newmember@example.com",
  "role": "member"
}
```

---

### `GET /api/v1/invitations/:token`

Get invitation details (public, no auth required).

---

### `POST /api/v1/invitations/:token/accept`

Accept an invitation. Creates a workspace membership.

---

### `DELETE /api/v1/workspaces/:workspaceId/invitations/:invitationId`

Cancel a pending invitation. Requires **Admin** or **Owner**.

---

## Projects

### `GET /api/v1/workspaces/:workspaceId/projects`

List all projects in the workspace.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by status: `active`, `archived`, `completed` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

---

### `POST /api/v1/workspaces/:workspaceId/projects`

Create a project. Requires **Member** or above.

**Body:**
```json
{
  "name": "Website Redesign",
  "description": "Full redesign of marketing site",
  "color": "#6366F1",
  "startDate": "2024-02-01",
  "dueDate": "2024-04-30"
}
```

---

### `GET /api/v1/projects/:projectId`

Get project details including boards and sprint summary.

---

### `PATCH /api/v1/projects/:projectId`

Update project details. Requires **Member** or above.

---

### `DELETE /api/v1/projects/:projectId`

Archive or delete a project. Requires **Admin** or **Owner**.

---

## Boards & Columns

### `GET /api/v1/projects/:projectId/boards`

List all boards in a project.

---

### `POST /api/v1/projects/:projectId/boards`

Create a board.

**Body:**
```json
{
  "name": "Development Board"
}
```

---

### `GET /api/v1/boards/:boardId/columns`

Get columns for a board (with tasks).

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "name": "To Do",
    "position": 0,
    "taskLimit": null,
    "tasks": [...]
  }
]
```

---

### `POST /api/v1/boards/:boardId/columns`

Create a column.

**Body:**
```json
{
  "name": "In Review",
  "position": 2,
  "color": "#F59E0B"
}
```

---

### `PATCH /api/v1/columns/:columnId`

Update a column (name, position, limit).

---

### `POST /api/v1/boards/:boardId/columns/reorder`

Reorder columns via drag-and-drop.

**Body:**
```json
{
  "columnIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

---

## Tasks

### `GET /api/v1/workspaces/:workspaceId/tasks`

List tasks with filtering.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `projectId` | UUID | Filter by project |
| `sprintId` | UUID | Filter by sprint |
| `assigneeId` | UUID | Filter by assignee |
| `priority` | string | critical, high, medium, low, none |
| `status` | string | todo, in_progress, in_review, done |
| `labelId` | UUID | Filter by label |
| `search` | string | Full-text search on title/description |
| `page` | number | Default: 1 |
| `limit` | number | Default: 50 |

---

### `POST /api/v1/projects/:projectId/tasks`

Create a task.

**Body:**
```json
{
  "title": "Build login page",
  "description": "## Acceptance Criteria\n- [ ] Email/password form\n- [ ] OAuth buttons",
  "columnId": "uuid",
  "priority": "high",
  "dueDate": "2024-03-15T00:00:00Z",
  "assigneeIds": ["uuid-1", "uuid-2"],
  "labelIds": ["uuid-label"],
  "estimatedHours": 4,
  "storyPoints": 3
}
```

---

### `GET /api/v1/tasks/:taskId`

Get full task detail including comments, attachments, and activity.

---

### `PATCH /api/v1/tasks/:taskId`

Update a task. Any fields from the create body can be updated.

---

### `DELETE /api/v1/tasks/:taskId`

Delete a task and all sub-tasks.

---

### `POST /api/v1/tasks/:taskId/move`

Move a task to a different column or board.

**Body:**
```json
{
  "columnId": "uuid",
  "position": 2
}
```

---

### `POST /api/v1/tasks/reorder`

Bulk reorder tasks within or across columns.

**Body:**
```json
{
  "updates": [
    { "taskId": "uuid-1", "columnId": "uuid-col", "position": 0 },
    { "taskId": "uuid-2", "columnId": "uuid-col", "position": 1 }
  ]
}
```

---

### `POST /api/v1/tasks/:taskId/dependencies`

Add a blocking dependency.

**Body:**
```json
{
  "blockerTaskId": "uuid"
}
```

---

## Comments

### `GET /api/v1/tasks/:taskId/comments`

Get all comments on a task (threaded).

---

### `POST /api/v1/tasks/:taskId/comments`

Add a comment. Supports Markdown. `@user-id` mentions trigger notifications.

**Body:**
```json
{
  "content": "This is blocked by #123. CC @uuid-of-user",
  "parentId": null
}
```

---

### `PATCH /api/v1/comments/:commentId`

Edit a comment. Author only.

---

### `DELETE /api/v1/comments/:commentId`

Delete a comment. Author or Admin.

---

## Labels

### `GET /api/v1/workspaces/:workspaceId/labels`

List all labels for the workspace.

---

### `POST /api/v1/workspaces/:workspaceId/labels`

Create a label.

**Body:**
```json
{
  "name": "Bug",
  "color": "#EF4444"
}
```

---

## Sprints

### `GET /api/v1/projects/:projectId/sprints`

List all sprints.

---

### `POST /api/v1/projects/:projectId/sprints`

Create a sprint.

**Body:**
```json
{
  "name": "Sprint 3",
  "goal": "Complete authentication and onboarding",
  "startDate": "2024-03-01",
  "endDate": "2024-03-14"
}
```

---

### `POST /api/v1/sprints/:sprintId/start`

Start a sprint (sets status to `active`). Only one active sprint per project.

---

### `POST /api/v1/sprints/:sprintId/complete`

Complete a sprint. Incomplete tasks can be moved to backlog or next sprint.

**Body:**
```json
{
  "incompleteTaskAction": "backlog",
  "targetSprintId": null
}
```

---

## Attachments

### `POST /api/v1/tasks/:taskId/attachments`

Upload a file attachment. Multipart form data.

**Form fields:**
- `file`: The file (max 25MB)

**Response `201`:**
```json
{
  "id": "uuid",
  "filename": "design-spec.pdf",
  "fileUrl": "https://cdn.example.com/...",
  "fileSize": 204800,
  "mimeType": "application/pdf"
}
```

---

### `DELETE /api/v1/attachments/:attachmentId`

Delete an attachment. Uploader or Admin only.

---

## Notifications

### `GET /api/v1/notifications`

Get the current user's notifications (most recent first).

**Query params:**
| Param | Type | Description |
|---|---|---|
| `unreadOnly` | boolean | Default: false |
| `limit` | number | Default: 20 |

---

### `POST /api/v1/notifications/read`

Mark notifications as read.

**Body:**
```json
{
  "notificationIds": ["uuid-1", "uuid-2"]
}
```

Or mark all: `{ "all": true }`

---

## Activity Logs

### `GET /api/v1/workspaces/:workspaceId/activity`

Get workspace-level activity feed.

---

### `GET /api/v1/tasks/:taskId/activity`

Get task-specific activity log.

---

## Billing

> See [BILLING.md](./BILLING.md) for the full Stripe integration guide.

### `GET /api/v1/workspaces/:workspaceId/billing`

Get current subscription details.

---

### `POST /api/v1/workspaces/:workspaceId/billing/checkout`

Create a Stripe Checkout session.

**Body:**
```json
{
  "plan": "pro",
  "seats": 5
}
```

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

---

### `POST /api/v1/workspaces/:workspaceId/billing/portal`

Create a Stripe Customer Portal session for plan management.

---

## Webhooks

### `POST /api/webhooks/stripe`

Stripe webhook endpoint. Handles:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

> Requires `STRIPE_WEBHOOK_SECRET` environment variable.
