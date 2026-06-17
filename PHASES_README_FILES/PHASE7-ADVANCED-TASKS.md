# Phase 7: Advanced Tasks

**Goal:** Sub-tasks, dependencies, labels, time tracking, story points, bulk actions, and global search.

## What This Phase Does

Phase 7 upgrades the basic task management system built in Phase 6 into an enterprise-grade Agile platform. 
- **Sub-tasks:** Allows users to create infinite nested child tasks, complete with an animated progress bar.
- **Dependencies (Blockers):** Allows linking tasks together via "Blocked By" relationships.
- **Label Management:** Introduces a Workspace Settings page to create custom, color-coded tags that can be applied to tasks.
- **Time Tracking:** Implements numerical fields for Estimated Hours, Actual Hours, and Story Points.
- **Bulk Task Actions:** Adds multi-select checkboxes to the My Tasks view to perform mass deletions and mass status updates.
- **Global Search:** Introduces a top-level Header search bar that uses PostgreSQL's native `mode: 'insensitive'` capabilities to search all task titles and descriptions.
- **Axios Refactoring & Service Standardization:** Migrated the entire frontend from raw `fetch()` calls to a clean, centralized `axios`-based service architecture for maximum type-safety and error handling.
- **Board Section Management:** Introduced dynamic Kanban column creation ("Add Section") complete with glassmorphic modal and real-time state updates.

## Files Created & Modified in Phase 7

| File | Purpose |
| ---- | ------- |
| `src/components/task/TaskModal.tsx` | Upgraded to include inputs for Time Tracking, Story Points, Sub-tasks, Dependencies, and Labels. |
| `src/app/(dashboard)/dashboard/tasks/MyTasksClient.tsx` | Upgraded to support multi-select checkboxes and a Bulk Actions toolbar. |
| `src/components/shared/Header.tsx` | Added the Global Search Bar that routes to `/dashboard/tasks?q=`. |
| `src/app/(dashboard)/workspace/[workspaceId]/settings/page.tsx` | New server page for Workspace Settings. |
| `src/app/(dashboard)/workspace/[workspaceId]/settings/SettingsClient.tsx` | UI for creating and managing custom colored Labels. |
| `src/app/api/tasks/[taskId]/dependencies/route.ts` | New API endpoint for creating `TaskDependency` records. |
| `src/app/api/workspaces/[workspaceId]/labels/route.ts` | New API endpoint for fetching and creating `Label` records. |
| `src/app/api/tasks/route.ts` | Upgraded to accept the `?q=` parameter for full-text search. |
| `src/app/api/tasks/[taskId]/route.ts` | Upgraded `PATCH` and `GET` to support recursive Sub-tasks and Time metrics. |
| `src/services/*.ts` | All files (`authService`, `taskService`, `projectClientService`, etc.) refactored to use direct `axios` implementations. |
| `src/components/project/BoardView.tsx` | Upgraded to include the "Add Section" button and logic for dynamically creating Kanban columns. |
| `src/components/project/CreateColumnDialog.tsx` | New glassmorphism UI modal for inputting custom column names. |

## How It Works

1. **Sub-tasks:** Pressing Enter in the sub-task input sends a `POST /api/tasks` request with `parentTaskId` set to the current task's ID.
2. **Global Search:** Typing in the Header redirects the user to `/dashboard/tasks?q=search_term`. The `GET /api/tasks` backend query uses Prisma's `OR: [{title: {contains...}}]` logic to filter the list.
3. **Bulk Actions:** Selecting checkboxes builds a `Set` of Task IDs. Clicking "Delete Selected" runs a `for` loop firing `DELETE` requests for each ID.
4. **Labels:** Created in Workspace Settings, saved to the `Label` table, and then fetched inside the `TaskModal` to be attached to tasks via the `TaskLabel` join table.
5. **Axios Services:** Every UI component imports specific async functions (e.g., `createSubtask()`, `addDependency()`) from `src/services/`. These functions use `axios` to serialize the JSON and extract nested error messages (`error.response.data.error`), meaning the UI code stays pristine.
6. **Board Sections:** Clicking "Add Section" on the board opens a dialog. Submitting fires a `POST` request to `/api/boards/[boardId]/columns` through the `boardClientService.ts`, which persists the new column position and name to Postgres.

## API Table

| Method | Endpoint | Purpose | Body Payload |
| ------ | -------- | ------- | ------------ |
| `GET` | `/api/workspaces/[id]/labels` | Get workspace labels | None |
| `POST` | `/api/workspaces/[id]/labels` | Create a new label | `{ name: "Bug", color: "#FF0000" }` |
| `POST` | `/api/tasks/[taskId]/dependencies` | Create a Blocked By link | `{ dependentTaskId: "BLOCKER_TASK_ID" }` |
| `GET` | `/api/tasks?q=[term]` | Global Search | None |
| `POST` | `/api/tasks` | Create Sub-task | `{ parentTaskId: "PARENT_ID", ... }` |
| `PATCH` | `/api/tasks/[taskId]` | Update Time Metrics | `{ estimatedHours: 8, actualHours: 4.5, storyPoints: 5 }` |
| `POST` | `/api/boards/[boardId]/columns` | Add Board Section | `{ workspaceId: "WS_ID", name: "QA" }` |

---

## 🧪 How to Test Phase 7 (Frontend Guide)

Follow these steps exactly to verify that all enterprise features are working seamlessly across the UI:

### Step 1: Test the Workspace Label Manager
1. In the sidebar, click on your Workspace Name and navigate to `/workspace/YOUR_ID/settings` (or manually type it into your URL bar).
2. You should see the **Workspace Settings** page.
3. In the "Create New Label" box, type "Critical Bug".
4. Click the color picker box and select a bright red color.
5. Click **+ Add Label**. You should instantly see it appear on the right side under "Existing Labels".

### Step 2: Test Time Tracking & Story Points
1. Navigate back to your Kanban Board (`/workspace/YOUR_ID`).
2. Click on any existing Task Card to open the **Task Modal**.
3. Scroll down to the grid section. Locate the **Story Points** input and type `5`.
4. Locate the **Estimated Hours** input and type `8`.
5. Locate the **Actual Hours** input and type `2.5`.
6. Click outside the input box to trigger the Auto-Save. *(Behind the scenes, this executes the PATCH request to PostgreSQL).*
7. Close the modal, refresh the page, and open it again to verify the numbers were permanently saved.

### Step 3: Test Sub-tasks Architecture
1. Inside the Task Modal, scroll to the bottom to find the **Sub-Tasks** section.
2. In the text box that says `+ Add Sub-task (Press Enter)`, type "Write Unit Tests" and press the **Enter** key on your keyboard.
3. The new sub-task will instantly appear in the list!
4. Notice the **Progress Bar** at the top of the section. It will currently show `0 / 1` completion.
5. Check the box next to your new sub-task. The text will strike-through, and the progress bar will animate beautifully to `100%`!
6. **New UI Check:** Close the modal and look at the Kanban board. Next to the Due Date on the card, you will now see a small checkbox icon that counts your sub-tasks (like `1/1`)!

### Step 4: Test Task Dependencies (Blocked By)
1. Inside the Task Modal, look for the **Blocked By (Dependencies)** dropdown.
2. Click it. It will dynamically show every other task in your workspace.
3. Select another task from the list. *(Behind the scenes, this creates the complex `TaskDependency` relationship in the database).*
4. **New UI Check:** Close the modal. You will instantly see a bright red `🛑 Blocked` badge on the task card! This warns everyone that the task cannot be started yet.

### Step 5: Test Global Search
1. Look at the top **Header Bar** of the application. There is a search box with a `⌘K` icon.
2. Type the exact title of one of your tasks (e.g., "Login System") and press **Enter**.
3. You will be instantly redirected to the `/dashboard/tasks` page.
4. **New Bug Fix:** If you are already on the Tasks page and use the search bar again, the page will now intelligently "listen" to the URL change and instantly apply the new filter!

### Step 6: Test Bulk Actions
1. On the `/dashboard/tasks` page, make sure the "All Tasks" toggle is selected.
2. Check the little checkbox to the left of two different tasks.
3. Notice that a beautiful glassmorphic **Bulk Actions Toolbar** slides down from the top of the screen!
4. In the dropdown inside the toolbar, select **"Done"**.
5. Wait one second. The page will auto-refresh, and both tasks will now have a green checkmark!
6. **New Auto-Routing Magic:** Navigate back to your Project Board. You will notice that those two tasks physically moved into the "Done" column! The backend now mathematically detects your board's column structure and moves tasks automatically.

### Step 7: Test Add Board Section (Column Creation)
1. Go to your Project Kanban Board (`/dashboard/projects/YOUR_PROJECT_ID`).
2. Look at the top right header of the board and click the **"Add Section"** button.
3. A sleek glassmorphism modal will pop up. Enter a name like "Blocked" or "Review".
4. Click **Create Section**.
5. The modal will close, and your brand new column will be instantly appended to the far right of your Kanban board! You can immediately start dragging tasks into it.

## 🛠️ How to Test Phase 7 (Backend via Postman)

Here is the step-by-step guide on how to test the Phase 7 backend APIs using Postman. Since our APIs are protected by strict security, you will need to authenticate Postman first!

### 🔐 Step 1: Authenticate Postman (Get the Cookie)
Because you cannot just send requests to a secure Next.js backend without being logged in, we need to grab your browser's login cookie.
1. Open your web browser and log into `http://localhost:3000`.
2. Right-click anywhere on the page and select **Inspect** to open Developer Tools.
3. Go to the **Application** tab at the top. On the left sidebar, click **Cookies** -> `http://localhost:3000`.
4. Look for the cookie named `session`. Double-click its **Value** and copy it.
5. Open Postman. Under the big blue "Send" button, click the small **Cookies** link.
6. Type `localhost`, click "Add Cookie", paste your `session` value, and click Save.

### 🏷️ Step 2: Test Label Creation (POST)
Let's directly talk to the database to create a new custom Workspace Label.
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/workspaces/YOUR_WORKSPACE_ID/labels` *(replace with your actual Workspace ID)*
- **Headers:** Set `Content-Type` to `application/json`
- **Body (JSON):**
  ```json
  {
    "name": "Postman Label",
    "color": "#10B981"
  }
  ```
- **Result:** You should receive a `201 Created` response containing the ID of your brand new green label!

### 📂 Step 3: Test Sub-task Creation (POST)
Let's prove the API can handle nested tasks by calling the dedicated sub-task endpoint.
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/tasks/YOUR_MAIN_TASK_ID/subtasks` *(replace with the ID of the task you want to add a child to)*
- **Body (JSON):**
  ```json
  {
    "title": "Sub-task made in Postman",
    "priority": "medium",
    "status": "todo"
  }
  ```
- **Result:** You will get a `201 Created` response. Because you called the specific sub-tasks endpoint, the backend safely infers the parent's workspace and board and links it as a child task!

### 🛑 Step 4: Test Task Dependencies (POST)
Let's forcefully block a task by creating a `TaskDependency` record.
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/tasks/YOUR_TASK_ID/dependencies` *(replace with the ID of the task you want to block)*
- **Body (JSON):**
  ```json
  {
    "dependentTaskId": "THE_ID_OF_THE_BLOCKING_TASK"
  }
  ```
- **Result:** You will receive a `200 OK` response. You have just successfully created a complex database join-table relationship via API!

### 🔍 Step 5: Test Global Full-Text Search (GET)
Let's test the PostgreSQL case-insensitive search engine via API.
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/tasks?workspaceId=YOUR_WORKSPACE_ID&q=Postman`
- **Result:** The backend will scan all tasks and return an array containing only the tasks where the word "Postman" appears in the title or description!
