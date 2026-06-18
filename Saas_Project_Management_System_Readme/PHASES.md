# 🗺️ Build Plan — Phase-by-Phase Guide

A clear, ordered roadmap for building the SaaS Project Management System from scratch.
Authentication is intentionally last so the core product works and is testable before adding auth complexity.

---

## Quick Overview of All Phases

| Phase | What You Build                | Why This Order                                      |
| ----- | ----------------------------- | --------------------------------------------------- |
| 1     | Project Setup & Tooling       | Foundation everything else depends on               |
| 2     | Database Schema & Prisma      | Data layer before any UI or logic                   |
| 3     | Core UI Shell & Layout        | Shared layout before feature pages                  |
| 4     | Workspace Management          | Top-level tenant entity first                       |
| 5     | Projects & Boards             | Container before the items inside                   |
| 6     | Tasks — Core                  | The heart of the product                            |
| 7     | Tasks — Advanced              | Enrich tasks after basics work                      |
| 8     | Team Invitations & Onboarding | Secure invite links to grow the workspace           |
| 9     | Sprints & Backlog             | Planning layer on top of tasks                      |
| 10    | Comments & Activity           | Collaboration layer                                 |
| 11    | Attachments, Notifications, Search, & Analytics | File uploads, real-time alerts, Cmd+K, and dashboards |
| 12    | Billing & Plans               | Monetization after product is complete              |
| 13    | Authentication & Auth Guards  | Wire up auth last, swap hardcoded user              |

---

## Phase 1 — Project Setup & Tooling

**Goal:** A working Next.js app with all tools configured, ready to build in.

### Steps

1. Scaffold the project

   ```bash
   pnpm create next-app@latest saas-pm --typescript --no-tailwind --app --src-dir
   cd saas-pm
   ```

2. Install core dependencies

   ```bash
   pnpm add prisma @prisma/client
   pnpm add @reduxjs/toolkit react-redux
   pnpm add lucide-react
   pnpm add -D @types/node @types/react
   ```

3. Set up custom CSS structure

   ```
   src/styles/
   ├── globals.css        ← CSS variables, resets, base styles
   ├── variables.css       ← design tokens (colors, spacing, typography)
   └── components/         ← per-component CSS files (optional, or co-located)
   ```

   Import `globals.css` and `variables.css` in `src/app/layout.tsx`.

4. Configure path aliases in `tsconfig.json`

   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": { "@/*": ["./src/*"] }
     }
   }
   ```

5. Configure ESLint, Prettier, `.editorconfig`

6. Set up folder structure

   ```
   src/
   ├── app/
   ├── components/
   ├── lib/
   ├── hooks/
   ├── types/
   └── server/
       ├── db/
       └── services/
   ```

7. Create `src/lib/utils.ts` with general utility helpers (no `cn()` needed without Tailwind)
8. Create `.env.local` from `.env.example`
9. Set up Redux store (`src/store/index.ts`) with `configureStore`, and wrap the app with `<Provider>` in root layout
10. Set up Git and commit

### ✅ Done When

- `pnpm dev` runs without errors
- Custom CSS (variables, globals) loads correctly across pages
- TypeScript shows no errors

---

## Phase 2 — Database Schema & Prisma

**Goal:** Full database schema in place with Prisma client working.

### Steps

1. Init Prisma

   ```bash
   pnpm prisma init
   ```

2. Write the full schema in `prisma/schema.prisma` — in this order:
   - `User`, `Account`, `Session` (auth tables, needed by everything)
   - `Workspace`, `WorkspaceMember`, `Invitation`
   - `Project`, `Board`, `Column`
   - `Task`, `TaskAssignee`, `TaskDependency`
   - `Label`, `TaskLabel`
   - `Sprint`
   - `Comment`, `Attachment`
   - `Notification`, `ActivityLog`
   - `Subscription`

3. Set `DATABASE_URL` in `.env.local`

4. Create and run the initial migration

   ```bash
   pnpm prisma migrate dev --name init
   ```

5. Create `src/lib/db.ts` — Prisma singleton

   ```typescript
   import { PrismaClient } from "@prisma/client";
   const globalForPrisma = globalThis as { prisma?: PrismaClient };
   export const prisma = globalForPrisma.prisma ?? new PrismaClient();
   if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
   ```

6. Write `prisma/seed.ts` with:
   - 1 hardcoded user (you'll replace with real auth in Phase 14)
   - 1 workspace
   - 2 projects with boards, columns, and sample tasks

7. Run seed

   ```bash
   pnpm prisma db seed
   ```

8. Open Prisma Studio and verify data
   ```bash
   pnpm prisma studio
   ```

### ✅ Done When

- All tables exist in the DB
- `prisma.task.findMany()` returns seeded tasks
- No migration errors

---

## Phase 3 — Core UI Shell & Layout

**Goal:** The app shell — sidebar, header, navigation — with hardcoded workspace data.

> No auth yet. Use the seeded user/workspace ID directly in server components.

### Steps

1. Create route groups

   ```
   src/app/
   ├── (dashboard)/
   │   └── [workspace]/
   │       └── layout.tsx       ← main app layout
   └── layout.tsx               ← root layout
   ```

2. Build the sidebar component (`src/components/shared/Sidebar.tsx`)
   - Workspace name + logo
   - Nav links: Dashboard, Projects, My Tasks, Members, Settings
   - Collapsible on mobile

3. Build the top header (`src/components/shared/Header.tsx`)
   - Breadcrumb
   - Search bar (static for now)
   - User avatar menu (hardcoded)

4. Build the workspace layout (`[workspace]/layout.tsx`)
   - Fetch workspace by slug from DB
   - Render sidebar + header + `{children}`

5. Create a placeholder dashboard page (`[workspace]/page.tsx`)

6. Set up Redux store slices (e.g. `workspaceSlice`, `uiSlice`) and ensure `<Provider store={store}>` wraps the app in root layout

7. Create `src/lib/errors.ts` with `AppError`, `NotFoundError`, `ForbiddenError`

8. Create a global error boundary (`error.tsx`) and loading skeleton (`loading.tsx`)

### ✅ Done When

- Navigating to `/demo-workspace` shows the app shell
- Sidebar links navigate between pages
- Layout renders on mobile

---

## Phase 4 — Workspace Management

**Goal:** Full CRUD for workspaces and members.

### Steps

1. Create workspace service (`src/services/workspace.service.ts`)
   - `getWorkspace(slug)`
   - `updateWorkspace(id, data)`
   - `getMembers(workspaceId)`
   - `removeMember(workspaceId, userId)`
   - `updateMemberRole(workspaceId, userId, role)`

2. Create API routes
   - `GET/PATCH /api/workspaces/[workspaceId]`
   - `GET /api/workspaces/[workspaceId]/members`
   - `PATCH/DELETE /api/workspaces/[workspaceId]/members/[userId]`

3. Build Members page (`[workspace]/members/page.tsx`)
   - Member list with avatars, names, roles
   - Role change dropdown (Admin/Owner only)
   - Remove member button

4. Build Settings page (`[workspace]/settings/page.tsx`)
   - Workspace name edit
   - Logo upload placeholder
   - Danger zone (delete workspace)

5. Build workspace picker page (`/dashboard/page.tsx`)
   - Lists all workspaces the user belongs to
   - "Create workspace" form

6. Add validation for all inputs

### ✅ Done When

- Member list loads from DB
- Workspace name can be updated
- Role changes persist

---

## ✅ Phase 5 — Projects & Boards [COMPLETED]

**Goal:** Create and manage projects, boards, and Kanban columns.

### Steps

1. ✅ Create project service (`src/services/project.service.ts`)
   - `getProjects(workspaceId)`
   - `createProject(workspaceId, userId, data)` — auto-creates default board + 4 columns
   - `updateProject(workspaceId, id, data)`
   - `archiveProject(workspaceId, id)`

2. ✅ Create board & column services (`src/services/board.service.ts`)
   - `getBoard(workspaceId, boardId)` — with columns + tasks
   - `createColumn(workspaceId, boardId, data)`
   - `updateColumn(workspaceId, id, data)`
   - `reorderColumns(workspaceId, boardId, columnIds)`
   - `deleteColumn(workspaceId, columnId)`

3. ✅ Create API routes
   - `GET/POST  /api/projects`
   - `GET/PATCH/DELETE  /api/projects/[projectId]`
   - `GET  /api/boards/[boardId]`
   - `POST/PATCH  /api/boards/[boardId]/columns`
   - `PATCH/DELETE  /api/boards/[boardId]/columns/[columnId]`

4. ✅ Build Projects list page (`dashboard/projects/page.tsx`)
   - Grid of project cards with color bar, status badge, task count, due date
   - "New Project" dialog with name, description, color picker

5. ✅ Build Project detail page (`dashboard/projects/[projectId]/page.tsx`)
   - Tab bar: Board | List | Settings

6. ✅ Build Kanban Board view (`components/project/BoardView.tsx`)
   - Columns rendered side by side with color-coded headers
   - Task cards inside columns
   - "Add task" inline button per column
   - Column header with task count and WIP limit display

7. ✅ Build List view (`components/project/ListView.tsx`)
   - Table of all tasks with status, priority, assignee avatars, due date

8. ✅ Build Project settings tab (`components/project/ProjectSettings.tsx`)
   - Edit name, description, color
   - Danger zone — Archive project

### ✅ Done When

- ✅ Projects list shows all seeded projects
- ✅ Board view renders columns and task cards
- ✅ New project can be created and appears in the list

---

## Phase 6 — Tasks (Core)

**Goal:** Full task CRUD, Kanban drag-and-drop, and task detail panel.

### Steps

1. Create task service (`src/services/task.service.ts`)
   - `getTasks(workspaceId, filters)`
   - `getTask(workspaceId, taskId)` — full detail
   - `createTask(workspaceId, projectId, userId, data)`
   - `updateTask(workspaceId, taskId, data)`
   - `deleteTask(workspaceId, taskId)`
   - `moveTask(workspaceId, taskId, columnId, position)`
   - `reorderTasks(workspaceId, updates[])`

2. Create API routes for tasks

3. Install drag-and-drop library

   ```bash
   pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```

4. Add drag-and-drop to Board view
   - Drag tasks within a column (reorder)
   - Drag tasks between columns (move)
   - Optimistic UI update → API call → revert on error

5. Build Task Card (`components/task/TaskCard.tsx`)
   - Title, priority badge, assignee avatars, due date, label chips
   - Click opens task detail panel

6. Build Task Detail Panel / Drawer (`components/task/TaskDetail.tsx`)
   - Edit title inline
   - Edit description (Markdown editor — use `@uiw/react-md-editor`)
   - Priority selector
   - Status selector
   - Assignee picker (workspace members)
   - Due date picker
   - Label selector
   - Sub-tasks section (list of child tasks)
   - Delete task button

7. Build "My Tasks" page (`[workspace]/tasks/page.tsx`)
   - All tasks assigned to the current user
   - Filter by priority, status, project

8. Build task filters component (priority, assignee, label, due date)

### ✅ Done When

- Tasks can be dragged between columns
- Task detail panel opens and edits save
- My Tasks page shows correct tasks

---

## Phase 7 — Tasks (Advanced)

**Goal:** Sub-tasks, dependencies, labels, time tracking, bulk actions.

### Steps

1. Sub-tasks
   - Create task with `parentTaskId`
   - Show sub-task checklist in task detail
   - Progress bar based on completed sub-tasks

2. Task dependencies
   - "Blocked by" relationship UI in task detail
   - Visual indicator on blocked tasks (blocked badge)
   - API: `POST /api/tasks/:id/dependencies`

3. Labels management
   - Labels settings page under workspace settings
   - Create/edit/delete labels with color picker
   - Label filter on board and list views

4. Time tracking
   - "Log time" button on task detail
   - Estimated hours field
   - Actual hours input
   - Shows "4h / 8h estimated" progress bar

5. Story points
   - Number input on task detail (for Scrum users)

6. Bulk task actions
   - Checkbox multi-select on list view
   - Bulk: assign, change status, add label, delete

7. Task search
   - Full-text search using PostgreSQL `to_tsvector`
   - Search bar in header activates search mode

### ✅ Done When

- Sub-tasks render and their completion affects parent progress
- Blocked tasks show visually
- Time can be logged and totals shown

---

## Phase 8 — Team Invitations, Security & Role-Based Access Control (RBAC)

**Goal:** Allow workspace owners to generate secure invite links, onboard new members, and enforce strict permissions across the platform.

### Steps

1. Create `WorkspaceInvite` model in Prisma schema
2. Create invite endpoints (`POST /api/workspaces/:id/invites`, `GET /api/workspaces/:id/invites`)
3. Create invite acceptance endpoint (`POST /api/invites/:token/accept`)
4. Build `InviteMemberModal.tsx` for generating cryptographic shareable links
5. Implement Custom Immutable Roles (roles lock on invite acceptance)
6. Prevent orphan workspaces when invited users log in for the first time
7. Enforce Role-Based Access Control (RBAC):
   - Only the **Owner** can create projects
   - Only the **Owner** can invite members or change roles
8. Enforce Task Modification Security:
   - Only Admins, Owners, task Creators, or Assignees can edit/drag tasks
   - Implement clean frontend alert popups for `403 Forbidden` errors

### ✅ Done When

- Owner can generate an invite link with a custom role
- Invited user can register, login, and click "Accept" to join the workspace
- Members are blocked from creating projects or removing other members
- Task dragging and updating is secured to authorized users only

---

## Phase 9 — Sprints & Backlog

**Goal:** Sprint planning, backlog management, burndown chart.

### Steps

1. Create sprint service (`src/services/sprint.service.ts`)
   - `getSprints(workspaceId, projectId)`
   - `createSprint(workspaceId, projectId, data)`
   - `startSprint(workspaceId, sprintId)`
   - `completeSprint(workspaceId, sprintId, incompleteAction)`

2. Create API routes for sprints

3. Build Backlog view (`components/project/BacklogView.tsx`)
   - Grouped by sprint + unassigned backlog section
   - Drag tasks between sprints and backlog
   - Sprint header with dates, goal, task count, story points

4. Build Sprint start dialog
   - Summary: task count, story points
   - Confirm start date / end date

5. Build Sprint complete dialog
   - Shows incomplete tasks
   - Option to move to backlog or next sprint

6. Build Burndown chart (`components/project/BurndownChart.tsx`)
   - X-axis: sprint days, Y-axis: remaining story points
   - Uses Recharts
   - Ideal line vs actual line

7. Add Sprint tab to project detail page

### ✅ Done When

- Sprint can be created, started, and completed
- Backlog tasks can be dragged into sprints
- Burndown chart renders with real data

---

## Phase 10 — Comments & Activity

**Goal:** Task comments with Markdown, @mentions, and an activity feed.

### Steps

1. Create comment service (`src/services/comment.service.ts`)
   - `getComments(workspaceId, taskId)`
   - `createComment(workspaceId, taskId, userId, content)`
   - `updateComment(workspaceId, commentId, userId, content)`
   - `deleteComment(workspaceId, commentId, userId)`

2. Create activity log service
   - `logActivity(workspaceId, entityType, entityId, action, before, after)`
   - Call this from all task/project service mutations

3. Create API routes for comments

4. Build Comment section in Task Detail
   - Markdown editor for writing comments
   - Rendered comment list (Markdown → HTML via `react-markdown`)
   - Edit/delete own comments
   - Threaded replies (1 level deep)
   - Show "edited" label on updated comments

5. Build @mention parsing
   - Parse `@userId` patterns in comment content
   - Show member picker dropdown when typing `@`
   - Store mention records

6. Build Activity tab in Task Detail
   - Timeline of all changes: "Jane changed priority from Low to High"
   - Show comment events inline in timeline

7. Build workspace Activity Feed page (`[workspace]/activity/page.tsx`)
   - All workspace events, most recent first
   - Filter by project or member

### ✅ Done When

- Comments can be written, edited, deleted
- Activity log shows task changes
- Workspace feed shows recent activity

---

## Phase 11 — File Attachments, Notifications, Global Search, & Analytics (Advanced Features)

**Goal:** Upload files, real-time in-app notifications, global app navigation, and a comprehensive dashboard.

### Part 1 — File Attachments

### Steps

1. Set up Local File Upload utility (`src/lib/upload.ts` or similar)
   - Save files directly to the `public/files` directory
   - Generate unique filenames to prevent collisions

2. Create attachment service
   - `createAttachment(workspaceId, taskId, userId, fileData)`
   - `deleteAttachment(workspaceId, attachmentId, userId)`

3. Create API routes
   - `POST /api/tasks/:taskId/attachments` — saves file to `public` folder and creates DB record
   - `DELETE /api/attachments/:id`

4. Build file upload UI in Task Detail
   - Drag-and-drop upload zone
   - Upload progress bar
   - File list with icons by MIME type
   - Download and delete buttons

5. Add file size validation (25MB limit)
6. Add MIME type filtering (images, PDFs, docs, etc.)
7. Show image previews inline for image attachments

### ✅ Done When

- Files upload locally to the `public/files` folder
- Attachments appear in task detail
- Files can be downloaded and deleted

---

### Part 2 — Notifications

**Goal:** In-app notifications for assignments, mentions, comments. No Redis — polling via RTK Query.

### Steps

1. Create notification service (`src/services/notificationService.ts`)
   - `getNotifications(workspaceId)`
   - `markAsRead(workspaceId, notificationId)`
   - `markAllAsRead(workspaceId)`
   - `deleteNotification(workspaceId, notificationId)`

2. Wire up notification creation in other services
   - Task assigned → notify assignees
   - Comment added → notify task creator + assignees
   - @mention → notify mentioned user

3. Create API routes for notifications
   - `GET /api/workspaces/:id/notifications`
   - `PATCH /api/workspaces/:id/notifications` (Mark all read)
   - `PATCH /api/workspaces/:id/notifications/:notifId` (Mark read)
   - `DELETE /api/workspaces/:id/notifications/:notifId` (Delete)

4. Build notification bell in Header
   - Unread count badge
   - Dropdown list of recent notifications
   - Click navigates to the relevant task
   - Delete/Archive old notifications from the dropdown

5. Set up polling
   - Use standard React `useEffect` and `setInterval` to poll the API every 30 seconds instead of RTK Query.

### ✅ Done When

- Assigning a task creates a notification for the assignee
- Bell icon shows unread count
- Notifications update every 30 seconds

---

### Part 3 — Dashboard & Analytics

**Goal:** A useful homepage with real data — progress, workload, recent activity.

### Steps

1. Build workspace Analytics route (`/api/workspaces/[id]/analytics`)
   - Aggregates tasks by status, priority, and assigns.
   - Calculates total members minus workspace owner.

2. Build Analytics Client (`[workspace]/analytics/AnalyticsClient.tsx`)
   - Stats cards: Total Projects, Total Tasks, Team Members, Completion Rate.
   - Task Status Distribution: Radial Bar Chart (Recharts)
   - Task Priority Distribution: Horizontal Bar Chart (Recharts)
   - Member Workload & Velocity: Overlapping Area Chart (Recharts)

3. Integrate to Sidebar
   - Add "Analytics" tab to left navigation.

### ✅ Done When

- Analytics dashboard shows real aggregated data from DB
- Charts render correctly with Recharts using correct axis labels and tooltips
- Owner is excluded from members stat card
- Subtasks are excluded from aggregations

---

### Part 4 — Global Command Menu & Search

**Goal:** Allow users to instantly search and navigate anywhere using keyboard shortcuts.

### Steps

1. Create a unified search API (`/api/workspaces/[id]/search?q=...`)
   - Query Prisma for Tasks, Projects, and Members simultaneously.
   - Use `contains` for case-insensitive partial matching.
   - Ensure permissions (only search within the active workspace).

2. Create Search Service (`src/services/searchService.ts`)
   - Build frontend fetch function with debouncing support.

3. Build `CommandMenu` UI Component
   - Listen for `Cmd+K` or `Ctrl+K` keydown events globally.
   - Build a glassmorphic modal overlay.
   - Implement `useDebounce` hook to prevent spamming the backend while typing.
   - Map results into distinct categories (Tasks, Projects, Members).

4. Add Keyboard Navigation & Deep Linking
   - Allow users to scroll results using `ArrowUp` and `ArrowDown`.
   - Pressing `Enter` instantly routes them to the correct board or opens the specific task modal.

### ✅ Done When

- Pressing `Cmd+K` opens the search modal from anywhere.
- Searching returns accurate Tasks, Projects, and Members.
- Arrow keys allow selecting results without a mouse.
- Pressing `Enter` routes correctly to the selected entity.

---

## Phase 12 — Billing & Plans

**Goal:** Stripe checkout, plan enforcement, subscription management.

### Steps

1. Install Stripe

   ```bash
   pnpm add stripe @stripe/stripe-js
   ```

2. Create `src/lib/stripe.ts` — Stripe client singleton

3. Create billing service (`src/services/billing.service.ts`)
   - `createCheckoutSession(workspaceId, plan, seats, userId)`
   - `createPortalSession(workspaceId)`
   - `getCurrentSubscription(workspaceId)`

4. Create Stripe webhook handler (`/api/webhooks/stripe/route.ts`)
   - Handle: `checkout.session.completed`
   - Handle: `customer.subscription.updated`
   - Handle: `customer.subscription.deleted`
   - Handle: `invoice.payment_failed`

5. Add plan limit checks to services
   - Member invite → check member limit
   - Project create → check project limit
   - Return `PlanLimitError` with upgrade URL

6. Build Billing settings page (`[workspace]/settings/billing/page.tsx`)
   - Current plan card
   - Usage meters (members used / limit, projects used / limit)
   - Upgrade button → Stripe Checkout
   - "Manage subscription" → Stripe Portal

7. Build plan limit error UI
   - When limit hit: modal explaining limit + upgrade CTA

8. Set up Stripe webhook locally

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

9. Test all 4 webhook events with Stripe CLI

### ✅ Done When

- Checkout session creates a Pro subscription
- Webhook updates `subscriptions` table
- Plan limits block resource creation at Free tier

---

## Phase 13 — Authentication (Last)

**Goal:** Replace the hardcoded seed user with real authentication. Add all auth flows and route guards.

> This is last because the entire product is now built and tested. Auth just wires up who the "current user" is.

### Steps

1. Install NextAuth.js

   ```bash
   pnpm add next-auth@beta bcryptjs
   pnpm add -D @types/bcryptjs
   ```

2. Write `src/lib/auth.ts` — NextAuth config
   - Prisma adapter
   - Credentials provider (email + password)
   - Google provider
   - GitHub provider
   - Session callback to include `user.id`

3. Create `src/app/api/auth/[...nextauth]/route.ts`

4. Create auth pages
   - `(auth)/login/page.tsx` — Login form (email/password + OAuth buttons)
   - `(auth)/register/page.tsx` — Register form
   - `(auth)/forgot-password/page.tsx`
   - `(auth)/reset-password/page.tsx`
   - `(auth)/verify-email/page.tsx`

5. Build auth API routes
   - `POST /api/auth/register` — create user, send verification email
   - `GET /api/auth/verify-email?token=...` — verify email
   - `POST /api/auth/forgot-password` — send reset email
   - `POST /api/auth/reset-password` — update password

6. Write `src/middleware.ts`
   - Redirect unauthenticated users from `/[workspace]/*` to `/login`
   - Redirect authenticated users from `/login` to `/dashboard`

7. Replace hardcoded user in all service functions
   - Remove seed user ID constants
   - Replace with `const session = await auth(); session.user.id`

8. Update workspace context helper
   - `getWorkspaceContext(slug)` now reads from real session
   - Verifies workspace membership on every request

9. Add `requireWorkspaceMember()` guard to all API routes
   - Minimum role checks per route

10. Add invite flow
    - Send invitation email via Resend
    - `GET /api/invitations/:token` — show invite details
    - `POST /api/invitations/:token/accept` — join workspace

11. Build onboarding flow for new users
    - After registration → Create first workspace
    - Create first project
    - Invite team members (skippable)

12. Security hardening
    - Add rate limiting table (`rate_limit_buckets`) for login attempts
    - Enforce email verification before login
    - Hash invitation/reset tokens before storing

13. Test all auth flows end-to-end

### ✅ Done When

- Login with email/password creates a real session
- OAuth login works with Google and/or GitHub
- All pages redirect to login when unauthenticated
- Workspace membership is enforced on every route
- Invitation email flow works end-to-end

---

## Final Checklist Before Launch

- [ ] All environment variables set in production
- [ ] Database migrations applied (`pnpm prisma migrate deploy`)
- [ ] Stripe webhook secret configured
- [ ] Email domain verified in Resend
- [ ] S3/R2 bucket with correct CORS policy
- [ ] OAuth redirect URIs updated to production URL
- [ ] `NEXTAUTH_URL` set to production domain
- [ ] Error tracking (Sentry) configured
- [ ] Smoke test: register → create workspace → create project → create task → invite member → upgrade plan

---

## Summary — The Golden Rule of This Order

```
Data  →  Shell  →  Workspaces  →  Projects  →  Tasks  →  Enrichments  →  Invitations  →  Sprints
→  Collaboration  →  Files  →  Notifications  →  Dashboard  →  Billing  →  Auth
```

Build the core **product** first. Add **auth last** so you can develop and test every
feature freely with a seed user, then lock it down once it all works.
