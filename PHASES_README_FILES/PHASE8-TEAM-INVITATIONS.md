# Phase 8: Team Invitations, Security & Role-Based Access Control (RBAC)

**Goal:** Allow workspace owners to generate secure invite links to onboard new members, strictly enforce Role-Based Access Control (RBAC) across the platform, and protect tasks from unauthorized modifications.

## What This Phase Does

This phase introduces a complete, secure onboarding pipeline for new users, coupled with strict permission boundaries ensuring that only authorized users can perform sensitive actions.

### 1. Invite Generation & Onboarding

- **Invite Generation:** A modal on the Members page to generate a secure, cryptographic token for a specific email. **Only the Workspace Owner can perform this action.**
- **Custom Immutable Roles:** Owners can type custom roles (e.g., "QA Tester", "Lead Designer") during invitation. Once accepted, these roles are locked and cannot be edited.
- **Pending Invites List:** A UI section to view and revoke invitations.
- **Seamless Login Flow:** Invited users who register and log in will directly join the workspace without the system auto-generating an empty personal workspace for them.

### 2. Strict Role-Based Access Control (RBAC)

- **Project Creation:** Only the **Owner** of the workspace can create new projects. Standard members and admins are explicitly blocked by the UI and the backend (`403 Forbidden`).
- **Member Management:** Only the **Owner** can invite new members, remove existing members, or revoke pending invitations.

### 3. Task Modification Security

- **Task Permissions:** Standard members can **only** edit, drag-and-drop, or bulk-update tasks if they are the creator or are explicitly assigned to that task.
- **Frontend Feedback:** Unauthorized attempts immediately revert the UI and generate a popup alert stating: _"Failed to update task. You might not have permission."_

## Files Created & Modified in Phase 8

| File                                                    | Purpose                                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `prisma/schema.prisma`                                  | Upgraded to include the `WorkspaceInvite` model.                                                 |
| `src/app/api/workspaces/[workspaceId]/invites/route.ts` | Endpoint for creating (`POST`) and fetching (`GET`) pending invites (Strictly locked to Owners). |
| `src/app/api/projects/route.ts`                         | Upgraded to strictly lock project creation to Owners.                                            |
| `src/app/api/tasks/[taskId]/route.ts`                   | Upgraded to strictly lock task updates to Admins, Owners, Creators, or Assignees.                |
| `src/app/api/auth/login/route.ts`                       | Fixed to prevent automatic workspace creation for invited users upon first login.                |
| `src/services/inviteService.ts`                         | Axios-based service layer handling all frontend requests for creating and accepting invites.     |
| `src/services/workspaceService.ts`                      | Axios-based service layer for fetching members and revoking invites.                             |
| `src/components/workspace/InviteMemberModal.tsx`        | Glassmorphic UI form for generating invites (Supports custom typed roles).                       |
| `src/app/(dashboard)/dashboard/members/MemberList.tsx`  | Removed role editing capabilities and restricted "Remove/Revoke" UI to Owners.                   |

## How It Works

1. **Generation:** The Owner clicks "Invite Member", types an email, and types a role (e.g., "Designer"). The backend verifies the user is the true `owner` and creates a `WorkspaceInvite` record with a unique 32-character hex token.
2. **Sharing:** The frontend displays a shareable link (e.g., `http://localhost:3000/invite/a1b2c3d4...`).
3. **Acceptance:** The invited user navigates to the link. They register, log in (without triggering auto-workspace creation), and click "Accept".
4. **Security Check:** The backend promotes the user to a `WorkspaceMember` with the immutable role, and instantly burns the token.

---

## 🧪 How to Test Phase 8 (Frontend Guide)

Follow these steps exactly to verify the invitation flow and strict RBAC security:

### Step 1: Project Creation RBAC

1. Log in as a user who is a standard **Member** of a workspace.
2. Navigate to the Projects page (`/dashboard/projects`).
3. **Verify:** The "New Project" button should be hidden. A text message "Only the workspace owner can create projects." should be visible.
4. Log out and log back in as the **Owner** of the workspace.
5. **Verify:** The "New Project" button is visible.

### Step 2: Generate an Invite Link & Custom Roles

1. As the **Owner**, go to your **Members** page (`/dashboard/members`).
2. Click the **"+ Invite Member"** button.
3. In the modal, type `friend@example.com`, type a custom role like `Guest Developer`, and click **Generate Invite Link**.
4. The modal will present a glowing box containing a unique URL. Click the **Copy** icon next to it.
5. Notice that your new invite is now sitting under "Pending Invitations".

### Step 3: Accept the Invite (Testing Login Flow)

1. Open a **New Incognito Window** (or log out).
2. Paste the URL you just copied into your browser.
3. Complete the registration form (Name, Email, Password).
4. After automatic redirect to the login page, enter the credentials to log in.
5. **Verify:** You are redirected directly to the Accept Invitation screen, and the system **did not** create an empty personal workspace for you.
6. Click **Accept Invitation**. You are redirected to the Dashboard.
7. Look at the Team Members list. **Verify:** You appear with the exact string "Guest Developer", and the role is completely locked (no input boxes to change it).

### Step 4: Task Modification Security

1. Log back in as the **Owner**. Create a task and assign it to "User A". Do not assign it to the "Guest Developer".
2. Log in as the **Guest Developer**.
3. Open the Kanban Board. Attempt to drag "User A's" task to "In Progress".
4. **Verify:** The task snaps back to its original column, and a browser alert pops up: _"Failed to move task. You might not have permission."_

---

## 🛠️ How to Test Phase 8 (Backend via Postman)

### 🔐 Step 1: Authenticate Postman (Get the Cookie)

Make sure Postman has your `session` cookie loaded.

### 🚫 Step 2: Test Project Creation RBAC (POST)

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/projects`
- **Headers:** Authorization `Bearer <token>` (Use a token for a standard **Member**).
- **Body:**
  ```json
  {
    "workspaceId": "your-workspace-id",
    "name": "Hacked Project"
  }
  ```
- **Expected Result:** `403 Forbidden` with `"Only the workspace owner can create new projects."`

### 💌 Step 3: Create a Workspace Invite (POST)

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/workspaces/YOUR_WORKSPACE_ID/invites`
- **Headers:** Switch token to the **Workspace Owner**.
- **Body (JSON):**
  ```json
  {
    "email": "postman@test.com",
    "role": "Lead Architect"
  }
  ```
- **Result:** You will receive a `201 Created` response containing the cryptographic `token`. Copy this `token` string for the next step!

### ✅ Step 4: Accept the Invitation (POST)

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/invites/YOUR_TOKEN_HERE/accept` _(Replace with the token you copied from Step 3)_
- **Headers:** Switch to the **Invited Member's** token (they must be registered and logged in).
- **Body:** None
- **Result:** `200 OK` response showing `{ success: true, workspaceId: "..." }`. The user is now a member of the workspace with their locked role!

### 🛡️ Step 5: Test Task Modification Security (PATCH)

- **Method:** `PATCH`
- **URL:** `http://localhost:3000/api/tasks/YOUR_TASK_ID`
- **Headers:** Use a standard **Member** token. Ensure the Task ID belongs to a task they did not create and are not assigned to.
- **Body (JSON):**
  ```json
  {
    "workspaceId": "your-workspace-id",
    "status": "done"
  }
  ```
- **Result:** `403 Forbidden` with `"Only assignees or admins can update this task"`.
