# Phase 9: Agile Sprints & Backlog
**Status:** Completed ✅

## 1. The "Why": Understanding Sprints & Backlogs in Plain English
Imagine you are managing a massive project (like building a new app or planning a huge marketing campaign), and your team comes up with 100 different tasks that need to be done.

**The Problem without Phase 9:**
If you put all 100 tasks on your Kanban Board right now, it will look like a chaotic, overwhelming mess. Your team won't know what to focus on first, and the "To Do" column will have a giant scrolling list of 100 items. It is impossible to track progress effectively.

**The Solution: Phase 9 (Agile Sprints)**
Instead of dealing with 100 tasks at once, Phase 9 introduces "Sprints" and a "Backlog":
1. **The Backlog (The Waiting Room):** You dump all 100 tasks into the Backlog. They sit there safely out of sight.
2. **The Sprint (The 2-Week Goal):** You create a "Sprint" (which is just a time-limit, usually 2 weeks). You look at your giant backlog and say: *"Okay team, let's only pick the 10 most important tasks to work on for the next 2 weeks."*
3. **The Focus (The Board):** You drag those 10 tasks into the active Sprint. Now, when your team looks at the Kanban Board, they *only* see those 10 tasks. They aren't overwhelmed by the other 90.
4. **The Burndown Chart (The Progress Tracker):** The chart calculates your speed. If you have 14 days to finish 10 tasks, it visually shows you if you are working fast enough to hit your deadline or if you are falling behind.
5. **The Reset:** At the end of the 2 weeks, you click "Complete Sprint". If you finished 8 tasks, the 2 unfinished tasks go back into the waiting room (Backlog). You then start a brand new Sprint for the next 2 weeks.

**Summary:** Phase 9 is the difference between a basic to-do list app (like Trello) and a professional enterprise management tool (like Jira). It gives teams the ability to plan work in focused, manageable "chunks" (Sprints) rather than drowning in an endless list of tasks!

---

## 2. A Real-World Example (Using Your Tasks)
Let's pretend you have two tasks in your project:
1. **"Manage the backend"** (To Do)
2. **"Make hero page"** (In Progress)

Here is exactly how you use Phase 9 with them:

* **Step 1:** Open your project and click the **"Backlog"** tab. At the bottom, you will see both tasks sitting in your backlog.
* **Step 2:** Click **"Create Sprint"**. A new empty box called "Sprint 1" appears.
* **Step 3:** You decide to focus *only* on the frontend this week. Click and drag **"Make hero page"** upward into the "Sprint 1" box. Leave "Manage the backend" at the bottom.
* **Step 4:** Click **"Start Sprint"**. The box turns active and a 14-day timer begins.
* **Step 5:** Click the **"Board"** tab. Notice that your board is now perfectly clean! It *only* shows "Make hero page". The backend task is safely hidden in the backlog so you aren't distracted. (Note: Both tasks still appear on the global "My Tasks" page so they are never truly lost).
* **Step 6:** As you work on "Make hero page" and drag it to "Done", the **Burndown Chart** in the Backlog tab will visually plot your success line dropping down!
* **Step 7:** After the week is over, click **"Complete Sprint"**. Sprint 1 is archived, and you are ready to create Sprint 2 for the backend task!

---

## 3. Frontend Testing & Backend Trace (How it works under the hood)

### Step 1: Navigating to the Project Backlog
* **Frontend Action:** Click the "Backlog" tab inside a project.
* **Backend Trace:** 
  * Calls `GET /api/projects/[projectId]/sprints`
  * Calls `GET /api/tasks?projectId=X&sprintId=null`
  * **Database:** Prisma fetches sprints, and then fetches tasks where `sprintId: null` (meaning they haven't been assigned to a sprint yet).

### Step 2: Creating a "Planned" Sprint
* **Frontend Action:** Click the "Create Sprint" button.
* **Backend Trace:** 
  * Calls `POST /api/projects/[projectId]/sprints` payload `{ name: "Sprint 1" }`
  * **Database:** Prisma inserts a new row into the Sprint table. Status defaults to `"planned"`.

### Step 3: Planning the Sprint (Drag & Drop)
* **Frontend Action:** Drag a task card from the Backlog into the Sprint box.
* **Backend Trace:** 
  * Calls `PATCH /api/tasks/[taskId]` payload `{ sprintId: "new-sprint-id" }`
  * **Database:** Prisma updates the Task row, replacing `sprintId: null` with the ID of the new sprint.

### Step 4: Starting the Sprint
* **Frontend Action:** Click "Start Sprint".
* **Backend Trace:** 
  * Calls `PATCH /api/sprints/[sprintId]` payload `{ status: "active", startDate: "today", endDate: "today + 14 days" }`
  * **Database:** Prisma updates the Sprint row, locking status to `"active"`.

### Step 5: Checking the Kanban Board & Burndown Chart
* **Frontend Action:** Go to the Board. It dynamically filters tasks based on the active sprint.
* **Backend Trace:**
  * Calls `GET /api/projects/[projectId]`
  * **Database:** Prisma checks if an active sprint exists. If yes, it fetches `tasks: { where: { sprintId: activeSprint.id } }`. If no active sprint exists, it fetches `tasks: { where: { sprintId: null } }`.
  * **Burndown Logic:** Calculates `sprint.startDate` vs `endDate`. Plots "Ideal" burn rate. Sums `storyPoints` of tasks with `status === "done"` to plot the "Actual" burn line.

### Step 6: Completing the Sprint
* **Frontend Action:** Click "Complete Sprint".
* **Backend Trace:**
  * Calls `PATCH /api/sprints/[sprintId]` payload `{ status: "completed", incompleteAction: "move_to_backlog" }`
  * **Database:** Prisma fetches all tasks inside the sprint. Filters out incomplete tasks. Runs `prisma.task.updateMany` setting `sprintId: null` on unfinished tasks. Updates Sprint status to `"completed"`.

---

## 4. Postman API Testing Guide
You can test the Sprint API directly in Postman using the following endpoints. 

*(Make sure to replace `[projectId]`, `[sprintId]`, `[taskId]`, and `[workspaceId]` with actual UUIDs from your database, and include your Authentication Cookie/Header).*

### 1. Get All Sprints for a Project
* **Method:** `GET`
* **URL:** `http://localhost:3000/api/projects/[projectId]/sprints?workspaceId=[workspaceId]`
* **Expected Response:** `200 OK` (Returns an array of sprint objects containing full task data).

### 2. Create a New Planned Sprint
* **Method:** `POST`
* **URL:** `http://localhost:3000/api/projects/[projectId]/sprints`
* **Body (JSON):**
  ```json
  {
    "workspaceId": "[workspaceId]",
    "name": "Sprint 1",
    "goal": "Build the frontend UI"
  }
  ```
* **Expected Response:** `201 Created` (Returns the new sprint object).

### 3. Assign a Task to a Sprint
* **Method:** `PATCH`
* **URL:** `http://localhost:3000/api/tasks/[taskId]`
* **Body (JSON):**
  ```json
  {
    "workspaceId": "[workspaceId]",
    "sprintId": "[new-sprint-id]"
  }
  ```
* **Expected Response:** `200 OK` (Returns the updated task object).

### 4. Start a Sprint
* **Method:** `PATCH`
* **URL:** `http://localhost:3000/api/sprints/[sprintId]`
* **Body (JSON):**
  ```json
  {
    "workspaceId": "[workspaceId]",
    "status": "active",
    "startDate": "2026-06-17T00:00:00.000Z",
    "endDate": "2026-07-01T00:00:00.000Z"
  }
  ```
* **Expected Response:** `200 OK` (Returns the updated sprint object).

### 5. Complete a Sprint (Moves unfinished tasks to backlog)
* **Method:** `PATCH`
* **URL:** `http://localhost:3000/api/sprints/[sprintId]`
* **Body (JSON):**
  ```json
  {
    "workspaceId": "[workspaceId]",
    "status": "completed",
    "incompleteAction": "move_to_backlog"
  }
  ```
* **Expected Response:** `200 OK` (Returns the completed sprint object).
