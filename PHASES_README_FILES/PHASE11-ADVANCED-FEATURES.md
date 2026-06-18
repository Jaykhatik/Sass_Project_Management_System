# Phase 11 - Advanced Features

> **Goal:** Enhance the core foundation, collaboration, and security systems by introducing four highly impactful advanced features suitable for a professional SaaS application.

## Phase 11 Roadmap

This phase is broken down into four distinct options/features. We are building them sequentially:

1. **Option 1: File Attachments & Local Storage (Completed)** 📎
   - Build a drag-and-drop file upload zone in the Task Modal.
   - Support uploading images, PDFs, and documents via a Local Storage Engine.
   - Display image previews and downloadable attachments directly in the Task Timeline.
2. **Option 2: Real-Time Notification Engine (Pending)** 🔔
   - Build a Notification Bell in the top navigation bar with a red unread badge.
   - Implement `@mentions` in the Markdown editor so users can ping each other.
   - Automatically generate targeted notifications when a user is assigned to a task or added to a project.
3. **Option 3: Global "Cmd+K" Command Menu & Search (Pending)** 🔍
   - Build a spotlight-style global search modal (similar to Notion or Slack).
   - Create a powerful backend search API that instantly queries across Projects, Boards, Tasks, and Members.
4. **Option 4: Analytics & Sprint Reports (Pending)** 📈
   - Integrate a charting library like Recharts or Chart.js.
   - Build a "Reports" dashboard showing Burn-down charts for active sprints and Member Velocity.

---

## Option 1: File Attachments & Local Storage

### What Option 1 Does

- Implements a fully functional **Local File Storage Engine** that safely stores uploaded files on the server's hard drive without needing third-party cloud accounts.
- Automatically categorizes uploads based on MIME types (routing images to `public/images/uploads` and documents to `public/files`).
- Generates cryptographically secure `uniqueFilename` strings to prevent file overwriting collisions.
- Integrates a beautiful **Drag-and-Drop Zone** (`TaskAttachments.tsx`) right inside the Task Modal.
- Displays a highly polished **Attachment Grid** that dynamically renders image thumbnails or sleek generic file icons depending on the file type.
- Parses byte-sized numbers into human-readable formats (e.g., "1.45 MB").
- Features one-click downloading from the browser.
- Enforces strict **Role-Based Access Control (RBAC)** on file deletion: Normal members can only delete files they uploaded; Workspace Owners can delete any file.
- Safely unlinks and deletes files from the physical hard drive (`fs.unlink`) when deleted via the UI, preventing server storage bloat.
- Handles Prisma `BigInt` serialization bugs gracefully to prevent `JSON.stringify` server crashes.
- **Activity Logging Integration:** Automatically logs "attached a file" and "deleted an attachment" events to the global `ActivityLog` table.
- **Enriched Hover Tooltips:** Updates the frontend Activity Feed to parse and display the exact filename uploaded/deleted when hovering over the log.

## Files Created & Modified in Phase 11

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Pre-existing `Attachment` model schema mapping files to tasks and workspaces |
| `src/app/api/tasks/[taskId]/attachments/route.ts` | API to handle `multipart/form-data` file uploads and fetch lists |
| `src/app/api/tasks/[taskId]/attachments/[attachmentId]/route.ts` | API to safely delete files from the database and the local filesystem |
| `src/services/api/routes.ts` | Added standardized route constants for the attachment endpoints |
| `src/services/attachmentService.ts` | Frontend service layer for uploading, fetching, and deleting attachments |
| `src/components/task/TaskAttachments.tsx` | The gorgeous Drag-and-Drop component and Attachment Grid UI |
| `src/components/task/TaskModal.tsx` | Modified to mount the `TaskAttachments` component |
| `src/app/(dashboard)/dashboard/activity/ActivityClient.tsx` | Updated to display the uploaded/deleted filename dynamically inside hover tooltips |
| `src/types/index.ts` | Updated TypeScript definitions to include the `Attachment` interfaces |

## How It Works

1. **Uploading:** A user drags a file into the upload zone. The frontend converts it to `FormData` and sends it via `POST /api/tasks/[taskId]/attachments`.
2. **Backend Processing:** The server extracts the `File` buffer, determines if it's an image or document, generates a unique hex-coded filename, and writes it directly to the `public/` directory using Node's native `fs` promises.
3. **Database Linking & Logging:** An `Attachment` record is created in PostgreSQL with the raw file URL, and an `ActivityLog` record is generated noting the filename and size.
4. **Rendering:** The `TaskAttachments` grid maps through the files. If `mimeType` starts with `image/`, it renders an `<img src={fileUrl} />`. Otherwise, it renders a Lucide `<File />` icon.
5. **Deletion:** Clicking the Trash icon triggers a `DELETE` request. The backend checks RBAC. If authorized, it uses `fs.unlink()` to permanently delete the physical file from the disk, removes the database record, and logs the deletion to the `ActivityLog`.

## API Table

| Method | Route | What it does | Request body | Returns |
|---|---|---|---|---|
| `GET` | `/api/tasks/[taskId]/attachments` | Load all attachments | None | Array of `Attachment` |
| `POST` | `/api/tasks/[taskId]/attachments` | Upload a file | `FormData` with a `file` | New `Attachment` |
| `DELETE` | `/api/tasks/[taskId]/attachments/[attachmentId]` | Delete a file | None | `{ success: true }` |

## Future Enhancements (Phase 11+)

- **Markdown Embeds:** Allow users to upload images directly inside the Markdown Comment editor.
- **Cloud Storage Migration:** Easily swap the `fs` logic with an S3 or UploadThing bucket if the app is deployed to a serverless environment like Vercel.

## Done When

- Users can drag-and-drop multiple files into the Task Modal.
- Images render actual preview thumbnails.
- Files render generic document icons.
- File sizes format correctly (e.g., KB, MB).
- Clicking the download icon successfully opens/downloads the file.
- `BigInt` serialization errors do not crash the frontend.
- Files can be securely deleted, and the physical file disappears from the local `public` folder.
- RBAC correctly blocks users from deleting files they don't own.

## How to Test Phase 11 (Frontend)

**Step 1: Test the Upload Zone**
1. Navigate to your Board and click a task to open the `TaskModal`.
2. Scroll to the "Attachments" section.
3. Drag and drop an image onto the dashed box. It should instantly upload and appear in the grid below.
4. Drag and drop a PDF or text file. It should upload and display a generic file icon.

**Step 2: Test Previews & Downloads**
1. Hover over the newly uploaded image. You will see Download and Delete icons.
2. Click the Download icon. The browser should open the image in a new tab or trigger a file download.

**Step 3: Test Deletion & RBAC**
1. Hover over your file and click the Trash icon. Accept the prompt. The file should vanish.
2. Verify locally: Open your project folder, navigate to `public/images/uploads/`, and confirm the file is physically gone.
3. Log in as a normal member. Look at an attachment uploaded by the Workspace Owner. The Trash icon should not exist for you.

## How to Test Phase 11 (Backend via Postman)

Because the app is secured with `HttpOnly` cookies, you must authenticate your Postman client first.

### Step 1: Get Your Authentication Cookie
1. Log into your app via the browser (`http://localhost:3000`).
2. Right-click the page -> **Inspect** -> **Application** tab -> **Cookies**.
3. Copy the value of the `session` cookie.
4. In Postman, click **Cookies** (under the Send button), type `localhost`, and add your session cookie.

### Step 2: Test File Uploading (POST)
- **URL:** `http://localhost:3000/api/tasks/YOUR_TASK_ID/attachments`
- **Method:** `POST`
- **Body:** Go to the "Body" tab, select `form-data`.
  - Add a key named `file`.
  - Hover over the key type (where it says Text) and change it to **File**.
  - Click "Select Files" in the value column and pick an image from your computer.
- **Result:** You will get a `201 Created` response returning the `Attachment` JSON object. Verify `fileSize` is parsed correctly as an integer.

### Step 3: Test Fetching Attachments (GET)
- **URL:** `http://localhost:3000/api/tasks/YOUR_TASK_ID/attachments`
- **Method:** `GET`
- **Result:** You will receive a JSON array containing all attachments for the task.

### Step 4: Test RBAC Secure Deletion (DELETE)
- **URL:** `http://localhost:3000/api/tasks/YOUR_TASK_ID/attachments/YOUR_ATTACHMENT_ID`
- **Method:** `DELETE`
- **Result:** 
  - If you are the uploader or workspace owner, returns `{ "success": true }`.
  - If you are a normal member deleting someone else's file, returns `403 Forbidden`.

---

## Option 2: Real-Time Notification Engine

### What Option 2 Does

- Introduces a robust real-time notification system to keep users engaged.
- Triggers notifications dynamically during specific backend actions (e.g., when a user is mentioned in a comment, assigned a new task, or joins a workspace).
- Builds a stunning `NotificationBell` component for the global navigation bar featuring an animated red pulsing badge for unread alerts.
- Features deep-linking: Clicking a task-related notification routes the user instantly to their `My Tasks` page and auto-opens the `TaskModal` for that exact task!
- Supports marking notifications as read individually, or via a "Mark all as read" bulk action.
- Allows users to permanently **delete** notifications from their feed once they have been read.

## Files Created & Modified for Option 2

| File | Purpose |
|---|---|
| `src/lib/notificationService.ts` | Backend server service to safely write `Notification` payloads to the database. |
| `src/services/notificationService.ts` | Frontend service layer for fetching, marking, and deleting notifications. |
| `src/app/api/workspaces/[workspaceId]/notifications/route.ts` | API endpoints for `GET` (fetch all) and `PATCH` (mark all as read). |
| `src/app/api/workspaces/[workspaceId]/notifications/[notificationId]/route.ts` | API endpoint for `PATCH` (mark single as read) and `DELETE` (delete notification permanently). |
| `src/components/shared/NotificationBell.tsx` | The UI component for the bell, unread badge, and notification dropdown. |
| `src/components/shared/Header.tsx` | Modified to render the `NotificationBell` and pass down the `workspaceId` via the layout. |
| `src/app/(dashboard)/dashboard/layout.tsx` | Fetches the primary workspace and passes the `workspaceId` prop down to the Header. |
| `src/app/api/tasks/[taskId]/comments/route.ts` | Modified to extract `@mentions` via string parsing and trigger a notification. |
| `src/app/api/tasks/[taskId]/route.ts` | Modified to detect *new* assignees during updates and trigger a notification. |
| `src/app/api/invites/[token]/accept/route.ts` | Modified to notify the workspace owner when a member accepts an invitation. |
| `src/app/(dashboard)/dashboard/tasks/MyTasksClient.tsx` | Modified to read `?taskId=` from the URL query params to auto-open the `TaskModal` (Deep Linking). |

## Option 2 API Table

| Method | Route | What it does | Request body | Returns |
|---|---|---|---|---|
| `GET` | `/api/workspaces/[id]/notifications` | Fetch latest 50 notifications | None | Array of `Notification` |
| `PATCH` | `/api/workspaces/[id]/notifications` | Mark all as read | None | `{ success: true }` |
| `PATCH` | `/api/workspaces/[id]/notifications/[notifId]` | Mark single as read | None | `{ success: true }` |
| `DELETE` | `/api/workspaces/[id]/notifications/[notifId]` | Delete a read notification | None | `{ success: true }` |

## How to Test Option 2 (Frontend)

To test properly, you must use **two different users**. The best way is to open your normal browser logged in as User A (Workspace Owner), and an **Incognito window** logged in as User B (Normal Member).

**Step 1: Test Task Assignment Alerts**
1. **As User A (Owner):** Open a task and assign it to **User B**.
2. **As User B (Incognito):** Look at the top navigation bar. Within 30 seconds, a red pulsing dot will appear on the Bell icon!
3. Click the Bell to open the dropdown and see the notification: *"You were assigned to a task: [Task Name]"*.
4. **Deep Linking:** Click the notification. It will navigate you to `/dashboard/tasks` and instantly open the Task Modal for that exact task!

**Step 2: Test `@Mentions`**
1. **As User B (Incognito):** Open a task comment box and type exactly: `@` followed by the Workspace Owner's exact name (e.g., `@Chetan this is a test`). Hit Post.
2. **As User A (Owner):** The red pulsing dot will appear on your Bell. Click it to see the alert *"User B mentioned you in a comment"*.

**Step 3: Test Read/Unread States & Deletion**
1. Trigger a few notifications. Open the dropdown.
2. Unread notifications have a subtle indigo background. Click the **Checkmark** icon on hover to mark it as read. The red bell dot will disappear if no unread notifications remain.
3. Once marked as read, hover over the notification again. The checkmark is replaced with a **Red X (Trash)** icon.
4. Click the **Red X** to permanently delete the notification from your feed!
5. Click **"Mark all as read"** at the top right of the dropdown to instantly mark all remaining alerts as read.

## How to Test Option 2 (Backend via Postman)

Just like Option 1, ensure you have copied your `session` cookie from the browser into Postman.

### Step 1: Test Fetching Notifications (GET)
- **URL:** `http://localhost:3000/api/workspaces/YOUR_WORKSPACE_ID/notifications`
- **Method:** `GET`
- **Result:** You will receive a JSON array containing up to 50 of your most recent notifications, ordered by date. Note the `id` of one of them.

### Step 2: Test Marking Single Notification as Read (PATCH)
- **URL:** `http://localhost:3000/api/workspaces/YOUR_WORKSPACE_ID/notifications/THAT_NOTIFICATION_ID`
- **Method:** `PATCH`
- **Result:** You will receive a `200 OK` with `{ "success": true }`. If you run the GET request again, `isRead` will be `true`.

### Step 3: Test Marking All as Read (PATCH)
- **URL:** `http://localhost:3000/api/workspaces/YOUR_WORKSPACE_ID/notifications`
- **Method:** `PATCH`
- **Result:** You will receive a `200 OK` with `{ "success": true }`. All your notifications for this workspace are now read.

### Step 4: Test Deleting a Notification (DELETE)
- **URL:** `http://localhost:3000/api/workspaces/YOUR_WORKSPACE_ID/notifications/THAT_NOTIFICATION_ID`
- **Method:** `DELETE`
- **Result:** You will receive a `200 OK` with `{ "success": true }`. If you try to run it again, you will receive a `403 Forbidden or Not Found` error.

## Future Enhancements (Phase 11+)

- **Activity Feed Integration for New Members:** Currently, when a user accepts an invitation and joins the workspace, a notification is sent directly to the Workspace Owner. In the future, we should also write a `"member_added"` event to the global `ActivityLog` so that it appears in the public Activity Feed for all members to see.
