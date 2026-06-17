# Phase 4 - Workspace Management

> **Goal:** Let users view and manage workspace members and workspace settings.

## What This Phase Does

- loads one workspace by slug
- shows all workspace members
- lets admins change member roles
- lets admins remove members
- lets users rename the workspace
- keeps the workspace slug fixed

## Files Created & Modified in Phase 4

| File | Purpose |
|---|---|
| `src/app/api/workspaces/by-slug/[slug]/route.ts` | Load workspace by slug |
| `src/app/api/workspaces/[workspaceId]/route.ts` | Update workspace name and logo |
| `src/app/api/workspaces/[workspaceId]/members/route.ts` | List workspace members |
| `src/app/api/workspaces/[workspaceId]/members/[userId]/route.ts` | Update role or remove member |
| `src/services/workspaceService.ts` | Frontend service for workspace calls |
| `src/app/(dashboard)/dashboard/members/page.tsx` | Members page |
| `src/app/(dashboard)/dashboard/members/MemberList.tsx` | Role dropdown and remove button |
| `src/app/(dashboard)/dashboard/settings/page.tsx` | Workspace settings page |
| `src/app/(dashboard)/dashboard/settings/SettingsForm.tsx` | Workspace name edit form |

## How It Works

1. The page asks for the workspace using the slug.
2. The API route reads the workspace from the database.
3. The members page requests the member list.
4. The client component changes the role or removes a member.
5. The API route checks the request.
6. Prisma updates the database.
7. The page refreshes to show the latest data.

## API Table

| Method | Route | What it does | Request body | Returns |
|---|---|---|---|---|
| `GET` | `/api/workspaces/by-slug/[slug]` | Load one workspace by slug | None | Workspace |
| `PATCH` | `/api/workspaces/[workspaceId]` | Update workspace name or logo | `{ name?, logoUrl? }` | Updated workspace |
| `GET` | `/api/workspaces/[workspaceId]/members` | Get all members | None | Member list |
| `PATCH` | `/api/workspaces/[workspaceId]/members/[userId]` | Change member role | `{ role }` | Updated member |
| `DELETE` | `/api/workspaces/[workspaceId]/members/[userId]` | Remove member | None | `{ success: true }` |

## Rules

| Rule | Where it is checked |
|---|---|
| Workspace name cannot be empty | API route |
| Role must be valid | API route |
| Owner cannot be removed | API route |
| Owner role should not be changed | API route |

## Done When

- workspace loads from the database
- workspace name updates correctly
- member roles update correctly
- member removal works
- settings page shows the current workspace
