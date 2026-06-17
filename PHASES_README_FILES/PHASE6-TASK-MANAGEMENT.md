# Phase 6 - Task Management

> **Goal:** Bring the Kanban board to life by allowing users to create, edit, move, and organize tasks within the columns.

## What This Phase Does

- Enables users to create new tasks inside specific columns.
- Provides a detailed Task Modal for updating task descriptions, priorities, and statuses.
- Allows assigning team members to specific tasks.
- Supports adding custom labels (e.g., "Bug", "Feature") to tasks.
- Implements drag-and-drop functionality to move tasks between columns.
- Implements deletion of tasks.
- Integrates a rich Markdown Editor (`@uiw/react-md-editor`) for task descriptions.
- Includes a gorgeous UI layout for nesting and managing Sub-Tasks.
- **Provides a global "My Tasks" page to view, search, and filter all tasks across the workspace.**

## Files Created & Modified in Phase 6

| File | Purpose |
|---|---|
| `src/app/api/tasks/route.ts` | API to create new tasks |
| `src/app/api/tasks/[taskId]/route.ts` | API to fetch, update, or delete a single task |
| `src/app/api/boards/[boardId]/tasks/reorder/route.ts` | API to handle drag-and-drop reordering |
| `src/services/taskService.ts` | Frontend service for API interactions |
| `src/components/task/TaskCard.tsx` | UI for the draggable task card on the board |
| `src/components/task/TaskModal.tsx` | The glassmorphism modal for editing task details |
| `src/components/task/CreateTaskDialog.tsx` | Dialog for quickly adding a new task |
| `src/app/(dashboard)/dashboard/tasks/page.tsx` | The server page for the global My Tasks view |
| `src/app/(dashboard)/dashboard/tasks/MyTasksClient.tsx` | The client component handling filtering and rendering the task list |

## How It Works

1. **Creation:** A user clicks "Add Task" in a column. The frontend calls `POST /api/tasks` with the `columnId`.
2. **Viewing/Editing:** Clicking a task opens `TaskModal.tsx`, which fetches the full task details (including assignees and labels) via `GET /api/tasks/[taskId]`.
3. **Updating:** Edits in the modal (like changing priority) trigger `PATCH /api/tasks/[taskId]`.
4. **Moving:** Dragging a task to a new column triggers `PATCH /api/boards/[boardId]/tasks/reorder`, updating the database so the new position is saved for everyone.
5. **Assignees:** Linking a user to a task creates a record in the `TaskAssignee` Prisma table.
6. **Global Viewing:** The `/dashboard/tasks` page aggregates tasks from all projects by calling `GET /api/tasks`, allowing filtering by status, priority, and text search.

## API Table

| Method | Route | What it does | Request body | Returns |
|---|---|---|---|---|
| `POST` | `/api/tasks` | Create a task | `{ workspaceId, columnId, title, ... }` | New Task |
| `GET` | `/api/tasks?workspaceId=[id]` | Load all tasks | Query: `workspaceId`, `projectId`, `assigneeId` | Array of Tasks |
| `GET` | `/api/tasks/[taskId]?workspaceId=[id]` | Load one task | Query: `workspaceId` | Task details + assignees |
| `PATCH` | `/api/tasks/[taskId]` | Update a task | `{ workspaceId, title, priority, assigneeIds... }` | Updated Task |
| `DELETE` | `/api/tasks/[taskId]?workspaceId=[id]` | Delete a task | Query: `workspaceId` | `{ success: true }` |
| `PATCH` | `/api/boards/[boardId]/tasks/reorder` | Drag-and-drop | `{ workspaceId, tasks: [{ id, columnId, position }] }`| `{ success: true }` |

## Future Enhancements (Phase 6+)

- **Comments:** Allow users to chat inside the task modal.
- **Attachments:** Support for uploading images/files to a task.

## Done When

- Tasks can be successfully created and show up on the Board view.
- Tasks can be clicked to reveal a beautifully styled Task Modal.
- Users can assign themselves or others to a task.
- Tasks can be dragged across columns and the state is successfully saved to the database.
- Tasks can be deleted.
- The global "My Tasks" page successfully filters tasks and integrates with the Task Modal.

## How to Test Phase 6 (Frontend)

**Step 1: Navigate to the Board**
1. Go to `http://localhost:3000`.
2. Go to the **Projects** page via your sidebar and click on an existing project.
3. You should see the Kanban Board with its columns.

**Step 2: Test Task Creation**
1. Scroll to the bottom of a column and click the **"+ Add Task"** button.
2. The `CreateTaskDialog` will appear.
3. Type a title and set the priority to "High".
4. Click **Create Task**. A new task card will appear inside the column.

**Step 3: Test Drag and Drop**
1. Click, hold, and drag the newly created task card to an adjacent column.
2. Release the mouse button. The card will snap into the new column.
3. *Behind the scenes, the frontend fires a `PATCH` request to save this new location in the database.*

**Step 4: Test the Task Modal (Editing, Markdown & Assigning)**
1. Click on the task card you just moved.
2. The **Task Modal** will slide into view.
3. Click the title at the top to change it.
4. Try typing `# Hello` or `**bold**` inside the new **Markdown Editor** description box!
5. Try assigning yourself to the task using the new **Assignees dropdown**.
6. *Because of the auto-save architecture, every time you click away from an input or select an assignee, it automatically saves to the database.*

**Step 5: Test Deletion**
1. While inside the Task Modal, click the **"Delete"** button in the top right corner.
2. Accept the confirmation prompt. The task will be permanently deleted from the board and the database.

**Step 6: Test the Global "My Tasks" Page**
1. Click **"My Tasks"** in your Sidebar (`/dashboard/tasks`).
2. You will see a list of tasks. Use the toggle at the top left to switch between **"All Tasks"** and **"My Tasks"**.
3. Use the Search bar to find a specific task by its title.
4. Try filtering the list by Status (e.g., "To Do") or Priority (e.g., "High").
5. Click on any task in the list to open its Task Modal and edit it seamlessly!

## How to Test Phase 6 (Backend via Postman)

Because the app is secured with `HttpOnly` cookies, you must authenticate your Postman client first.

### Step 1: Get Your Authentication Cookie
1. Log into your app via the browser (`http://localhost:3000`).
2. Right-click the page -> **Inspect** -> **Application** tab -> **Cookies**.
3. Copy the value of the `session` cookie.
4. In Postman, click **Cookies** (under the Send button), type `localhost`, and add your session cookie.

### Step 2: Test Task Creation (POST)
- **URL:** `http://localhost:3000/api/tasks`
- **Method:** `POST`
- **Body (JSON):**
  ```json
  {
    "workspaceId": "YOUR_WORKSPACE_ID",
    "projectId": "YOUR_PROJECT_ID",
    "boardId": "YOUR_BOARD_ID",
    "columnId": "YOUR_COLUMN_ID",
    "title": "Postman Test Task",
    "priority": "high"
  }
  ```
- **Result:** You will get a `201 Created` response. Copy the new task `id`.

### Step 3: Test Fetching a Single Task (GET)
- **URL:** `http://localhost:3000/api/tasks/YOUR_TASK_ID?workspaceId=YOUR_WORKSPACE_ID`
- **Method:** `GET`
- **Result:** You will get the task details along with assignees and labels.

### Step 4: Test Fetching All Tasks (GET)
- **URL:** `http://localhost:3000/api/tasks?workspaceId=YOUR_WORKSPACE_ID`
- **Method:** `GET`
- **Optional Queries:** You can append `&projectId=ID` or `&assigneeId=ID` to filter the results!
- **Result:** You will receive a JSON array containing all matching tasks across the workspace.

### Step 5: Test Updating Task (PATCH)
- **URL:** `http://localhost:3000/api/tasks/YOUR_TASK_ID`
- **Method:** `PATCH`
- **Body (JSON):**
  ```json
  {
    "workspaceId": "YOUR_WORKSPACE_ID",
    "title": "Updated from Postman!",
    "description": "This description was added via API",
    "assigneeIds": ["YOUR_USER_ID"]
  }
  ```
- **Result:** The task will be updated in the database.

### Step 6: Test Drag & Drop Reordering (PATCH)
- **URL:** `http://localhost:3000/api/boards/YOUR_BOARD_ID/tasks/reorder`
- **Method:** `PATCH`
- **Body (JSON):**
  ```json
  {
    "workspaceId": "YOUR_WORKSPACE_ID",
    "tasks": [
      {
        "id": "YOUR_TASK_ID",
        "columnId": "A_DIFFERENT_COLUMN_ID",
        "position": 5000
      }
    ]
  }
  ```
- **Result:** Task column and position are updated (`{ "success": true }`).

### Step 7: Test Deletion (DELETE)
- **URL:** `http://localhost:3000/api/tasks/YOUR_TASK_ID?workspaceId=YOUR_WORKSPACE_ID`
- **Method:** `DELETE`
- **Result:** Task is permanently deleted (`{ "success": true }`).
