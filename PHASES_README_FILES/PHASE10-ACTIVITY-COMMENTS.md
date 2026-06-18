# Phase 10 - Activity & Comments

> **Goal:** Introduce a comprehensive real-time auditing and collaboration engine, featuring a Global Activity Feed, unified Task Timeline with threaded Markdown comments, and strict Role-Based Access Control (RBAC) for security.

## What This Phase Does

- Implements a **Global Activity Feed** (`/dashboard/activity`) to track all actions across the workspace.
- Enriches raw activity logs with human-readable Task Titles and Project Names.
- Adds native hover tooltips to display precise changes (e.g., status updates or exact comment snippets) and UUIDs.
- Enables click-to-open functionality from the Global Feed, seamlessly launching the Task Modal.
- Merges system-generated logs and user comments into a unified **Task Timeline** inside the Task Modal.
- Integrates a rich **Markdown Editor** for threaded comment replies, editing, and deletion.
- Implements a **Smart Logging Engine** to prevent redundant database entries if no data actually changed during an update.
- Enforces strict **Role-Based Access Control (RBAC)**:
  - Only authors and Workspace Owners can edit or delete comments.
  - Only assigned members and Workspace Owners can update or move tasks.
  - Only Workspace Owners can delete tasks.
- Adds **Automatic Assignee Inheritance**, instantly syncing parent task assignees down to all nested subtasks.
- Creates a **Subtask Completion Blocker** that prevents completing a task if any of its subtasks are still pending.
- Implements **Deleted Task Interaction Handling**: If a user clicks an activity log for a task that has since been deleted, the Task Modal gracefully catches the `404`, alerts the user, and closes, preventing infinite loading screens.

## Files Created & Modified in Phase 10

| File | Purpose |
|---|---|
| `src/app/(dashboard)/dashboard/activity/page.tsx` | The server page for the Global Activity Feed |
| `src/app/(dashboard)/dashboard/activity/ActivityClient.tsx` | The client component handling activity rendering, hover details, and click-to-open modal logic |
| `src/components/task/TaskTimeline.tsx` | The unified timeline UI combining comments and system activities, enforcing UI-level RBAC |
| `src/components/task/TaskModal.tsx` | Updated to intercept activity clicks, pass down user roles, and prevent redundant API calls |
| `src/app/api/workspaces/[workspaceId]/activity/route.ts` | API to fetch and enrich workspace activity logs with entity titles |
| `src/app/api/tasks/[taskId]/comments/route.ts` | API to handle posting new comments |
| `src/app/api/tasks/[taskId]/comments/[commentId]/route.ts` | API with strict RBAC to handle editing and deleting comments |
| `src/app/api/tasks/[taskId]/route.ts` | Updated to enforce task RBAC, subtask blockers, and sync assignees |
| `src/app/api/tasks/[taskId]/subtasks/route.ts` | Updated to inherit parent assignees upon subtask creation |
| `src/lib/activityLogger.ts` | The core backend utility for recording actions to the database |

## How It Works

1. **Global Viewing:** Navigating to `/dashboard/activity` calls the backend, which queries all logs, cross-references task and project IDs to fetch their real titles, and returns the enriched data.
2. **Smart Logging:** When a user updates a task via `PATCH /api/tasks/[taskId]`, the backend diffs the old and new data. If status or priority changed, it logs the activity; otherwise, it skips it.
3. **Commenting:** Using the Markdown editor in the Task Timeline sends a `POST` request to create a comment, which automatically triggers the `activityLogger` to record the event.
4. **RBAC Validation:** Any request to `PATCH` or `DELETE` comments/tasks is intercepted by backend checks verifying the user's workspace role (`isOwner`) or relationship to the entity (`isAuthor`, `isAssignee`).
5. **Assignee Inheritance:** Updating a parent task's assignees triggers a cascade update across all its nested subtasks in the database.
6. **Subtask Blocker:** Moving a task to "done" triggers a database `count` of incomplete subtasks. If `count > 0`, the server responds with `400 Bad Request`.

## API Table

| Method | Route | What it does | Request body | Returns |
|---|---|---|---|---|
| `GET` | `/api/workspaces/[workspaceId]/activity` | Fetch enriched logs | Query: `projectId`, `memberId` | Array of `ActivityLog` |
| `POST` | `/api/tasks/[taskId]/comments` | Create a comment | `{ workspaceId, content, parentId? }` | New Comment |
| `PATCH` | `/api/tasks/[taskId]/comments/[commentId]` | Edit a comment | `{ workspaceId, content }` | Updated Comment |
| `DELETE` | `/api/tasks/[taskId]/comments/[commentId]` | Delete a comment | Query: `workspaceId` | `{ success: true }` |
| `PATCH` | `/api/tasks/[taskId]` | Update task (RBAC & Blockers) | `{ status, priority, assigneeIds... }` | Updated Task |
| `DELETE` | `/api/tasks/[taskId]` | Delete task (Owner only) | Query: `workspaceId` | `{ success: true }` |
| `POST` | `/api/tasks/[taskId]/subtasks` | Create subtask (Inherits assignees)| `{ title, status... }` | New Subtask |
| `GET` | `/api/auth/me` | Fetch current user for UI RBAC | None | `{ authenticated, user }` |

## Future Enhancements (Phase 10+)

- **@Mentions:** Implement parsing to notify users when they are `@mentioned` in a Markdown comment.
- **Push Notifications:** Tie the `ActivityLog` entries into a real-time WebSocket or Server-Sent Events (SSE) notification bell.
- **Comment Attachments:** Allow users to upload and embed files directly inside comments.

## Done When

- The Global Activity Feed successfully displays logs with real human-readable task/project titles.
- Hovering over an activity reveals its UUID and content preview (like comment text).
- Clicking a task activity opens the Task Modal dynamically without leaving the page.
- Comments can be posted, replied to, edited, and deleted using Markdown.
- Redundant system logs are filtered from the Task Timeline to prevent clutter next to comments.
- **RBAC:** Normal members cannot edit/delete others' comments or modify tasks they are not assigned to. Owners have full control.
- **Workflows:** Tasks cannot be marked "done" if subtasks are pending, and subtasks perfectly inherit parent assignees.

## How to Test Phase 10 (Frontend)

**Step 1: The Unified Task Timeline**
1. Navigate to "My Tasks" or a Project Board and click on a task to open the `TaskModal`.
2. Scroll down to the "Activity & Comments" section.
3. Type a message using Markdown (e.g., `**bold**`) and click **Comment**. The comment will appear instantly.
4. Change the task's status via the top dropdown. A system log (e.g., "changed status to in_progress") will appear chronologically below your comment.

**Step 2: Comment RBAC & Threading**
1. While logged in as a normal member, look at a comment posted by *another* user. You should only see the "Reply" icon.
2. Look at your *own* comment. You should see Edit and Delete icons.
3. Click Edit, change the text, and save. The comment should now have an "edited" badge.

**Step 3: Global Activity Feed & Interactions**
1. Navigate to `/dashboard/activity` using the sidebar.
2. Hover your mouse over the underlined task name in a comment log. A tooltip should appear showing the exact comment text.
3. Click anywhere on that activity row. The `TaskModal` will seamlessly pop open.

**Step 4: Subtask Workflows & Board Restrictions**
1. Go to a Kanban Board. Attempt to drag a task that is **not** assigned to you (as a non-owner). The card will snap back and alert you.
2. Assign a task to yourself, add a subtask, and leave it incomplete.
3. Drag the parent task into the "Done" column. An alert must appear stating: "Cannot complete task: 1 subtask(s) still pending" and snap back.

**Step 5: Deleted Task Handling**
1. Navigate to `/dashboard/activity`. Find an activity log for a task that has been deleted.
2. Click the activity row.
3. The Task Modal will attempt to load, realize the task is missing, display an alert ("This task was not found or has been deleted"), and seamlessly close itself without breaking the UI.

## How to Test Phase 10 (Backend via Postman)

Because the app is secured with `HttpOnly` cookies, you must authenticate your Postman client first.

### Step 1: Get Your Authentication Cookie
1. Log into your app via the browser (`http://localhost:3000`).
2. Right-click the page -> **Inspect** -> **Application** tab -> **Cookies**.
3. Copy the value of the `session` cookie.
4. In Postman, click **Cookies** (under the Send button), type `localhost`, and add your session cookie.

### Step 2: Test Fetching Global Activity (GET)
- **URL:** `http://localhost:3000/api/workspaces/YOUR_WORKSPACE_ID/activity`
- **Method:** `GET`
- **Result:** You will receive a JSON array containing all activity logs. Verify that the `entityTitle` property is populated with the correct human-readable names.

### Step 3: Test Comment Creation & Logging (POST)
- **URL:** `http://localhost:3000/api/tasks/YOUR_TASK_ID/comments`
- **Method:** `POST`
- **Body (JSON):**
  ```json
  {
    "workspaceId": "YOUR_WORKSPACE_ID",
    "content": "This is a test comment from Postman!"
  }
  ```
- **Result:** You will get a `200 OK` containing the new comment. Check the `ActivityLog` table to verify a new "commented" activity was recorded.

### Step 4: Test RBAC Comment Editing (PATCH)
- **URL:** `http://localhost:3000/api/tasks/YOUR_TASK_ID/comments/YOUR_COMMENT_ID`
- **Method:** `PATCH`
- **Body (JSON):**
  ```json
  {
    "workspaceId": "YOUR_WORKSPACE_ID",
    "content": "Updated comment content!"
  }
  ```
- **Result:** If you are the author or owner, it returns `200 OK` and updates `isEdited: true`. If you are a normal member editing someone else's comment, it returns `403 Forbidden`.

### Step 5: Test Subtask Completion Blocker (PATCH)
- **URL:** `http://localhost:3000/api/tasks/YOUR_TASK_ID`
- **Method:** `PATCH`
- **Body (JSON):**
  ```json
  {
    "workspaceId": "YOUR_WORKSPACE_ID",
    "status": "done"
  }
  ```
- **Result:** If the task has incomplete subtasks, the server will block the request and return `400 Bad Request` with `Cannot complete task: [X] subtask(s) still pending.`

### Step 6: Test Subtask Assignee Inheritance (POST)
- **URL:** `http://localhost:3000/api/tasks/YOUR_TASK_ID/subtasks`
- **Method:** `POST`
- **Body (JSON):**
  ```json
  {
    "title": "Inheritance Test Subtask",
    "status": "todo"
  }
  ```
- **Result:** Returns `201 Created`. Verify in the database that the new subtask automatically mirrored the assignees from the parent task.

### Step 7: Test RBAC Task Deletion (DELETE)
- **URL:** `http://localhost:3000/api/tasks/YOUR_TASK_ID?workspaceId=YOUR_WORKSPACE_ID`
- **Method:** `DELETE`
- **Result:** If logged in as the Workspace Owner, returns `{ "success": true }`. If logged in as anyone else, returns `403 Forbidden`.
