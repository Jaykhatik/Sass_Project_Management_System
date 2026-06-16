# Phase 6 - Task Management

> **Goal:** Bring the Kanban board to life by allowing users to create, edit, move, and organize tasks within the columns.

## What This Phase Does

- Enables users to create new tasks inside specific columns.
- Provides a detailed Task Modal for updating task descriptions, priorities, and statuses.
- Allows assigning team members to specific tasks.
- Supports adding custom labels (e.g., "Bug", "Feature") to tasks.
- Implements drag-and-drop functionality to move tasks between columns.
- Implements deletion of tasks.

## Files Involved (To Be Created/Updated)

| File | Purpose |
|---|---|
| `src/app/api/tasks/route.ts` | API to create new tasks |
| `src/app/api/tasks/[taskId]/route.ts` | API to fetch, update, or delete a single task |
| `src/app/api/boards/[boardId]/tasks/reorder/route.ts` | API to handle drag-and-drop reordering |
| `src/services/taskService.ts` | Frontend service for API interactions |
| `src/components/task/TaskCard.tsx` | UI for the draggable task card on the board |
| `src/components/task/TaskModal.tsx` | The glassmorphism modal for editing task details |
| `src/components/task/CreateTaskDialog.tsx` | Dialog for quickly adding a new task |

## How It Works

1. **Creation:** A user clicks "Add Task" in a column. The frontend calls `POST /api/tasks` with the `columnId`.
2. **Viewing/Editing:** Clicking a task opens `TaskModal.tsx`, which fetches the full task details (including assignees and labels) via `GET /api/tasks/[taskId]`.
3. **Updating:** Edits in the modal (like changing priority) trigger `PATCH /api/tasks/[taskId]`.
4. **Moving:** Dragging a task to a new column triggers `PATCH /api/boards/[boardId]/tasks/reorder`, updating the database so the new position is saved for everyone.
5. **Assignees:** Linking a user to a task creates a record in the `TaskAssignee` Prisma table.

## API Table

| Method | Route | What it does | Request body | Returns |
|---|---|---|---|---|
| `POST` | `/api/tasks` | Create a task | `{ workspaceId, columnId, title, ... }` | New Task |
| `GET` | `/api/tasks/[taskId]?workspaceId=[id]` | Load one task | Query: `workspaceId` | Task details + assignees |
| `PATCH` | `/api/tasks/[taskId]` | Update a task | `{ workspaceId, title, priority, ... }` | Updated Task |
| `DELETE` | `/api/tasks/[taskId]?workspaceId=[id]` | Delete a task | Query: `workspaceId` | `{ success: true }` |
| `PATCH` | `/api/boards/[boardId]/tasks/reorder` | Drag-and-drop | `{ workspaceId, tasks: [{ id, columnId, position }] }`| `{ success: true }` |

## Future Enhancements (Phase 6+)

- **Rich Text Descriptions:** Upgrade simple textareas to markdown/rich-text editors.
- **Subtasks:** Break large tasks down into smaller, checkable subtasks.
- **Comments:** Allow users to chat inside the task modal.
- **Attachments:** Support for uploading images/files to a task.

## Done When

- Tasks can be successfully created and show up on the Board view.
- Tasks can be clicked to reveal a beautifully styled Task Modal.
- Users can assign themselves or others to a task.
- Tasks can be dragged across columns and the state is successfully saved to the database.
- Tasks can be deleted.

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

**Step 4: Test the Task Modal (Editing)**
1. Click on the task card you just moved.
2. The **Task Modal** will slide into view.
3. Click the title at the top to change it, or add a detailed description in the text box.
4. Try changing the priority dropdown or picking a due date.
5. *Because of the auto-save architecture, every time you click away from an input, it automatically saves to the database.*

**Step 5: Test Deletion**
1. While inside the Task Modal, click the **"Delete"** button in the top right corner.
2. Accept the confirmation prompt. The task will be permanently deleted from the board and the database.

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

### Step 3: Test Fetching Task (GET)
- **URL:** `http://localhost:3000/api/tasks/YOUR_TASK_ID?workspaceId=YOUR_WORKSPACE_ID`
- **Method:** `GET`
- **Result:** You will get the task details along with assignees and labels.

### Step 4: Test Updating Task (PATCH)
- **URL:** `http://localhost:3000/api/tasks/YOUR_TASK_ID`
- **Method:** `PATCH`
- **Body (JSON):**
  ```json
  {
    "workspaceId": "YOUR_WORKSPACE_ID",
    "title": "Updated from Postman!",
    "description": "This description was added via API"
  }
  ```
- **Result:** The task will be updated in the database.

### Step 5: Test Drag & Drop Reordering (PATCH)
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

### Step 6: Test Deletion (DELETE)
- **URL:** `http://localhost:3000/api/tasks/YOUR_TASK_ID?workspaceId=YOUR_WORKSPACE_ID`
- **Method:** `DELETE`
- **Result:** Task is permanently deleted (`{ "success": true }`).
