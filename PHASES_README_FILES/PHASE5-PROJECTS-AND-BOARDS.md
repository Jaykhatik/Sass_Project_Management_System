# Phase 5 - Projects and Boards

> **Goal:** Let users create projects, open boards, and manage Kanban columns.

## What This Phase Does

- lists projects in a workspace
- creates a new project
- automatically creates a default board and columns
- opens one project with Board, List, and Settings tabs
- adds new columns to a board
- edits a column
- reorders columns
- deletes an empty column

## Files Involved

| File | Purpose |
|---|---|
| `src/app/api/projects/route.ts` | List and create projects |
| `src/app/api/projects/[projectId]/route.ts` | Load, update, or archive one project |
| `src/app/api/boards/[boardId]/route.ts` | Load one board with columns and tasks |
| `src/app/api/boards/[boardId]/columns/route.ts` | Add a column or reorder columns |
| `src/app/api/boards/[boardId]/columns/[columnId]/route.ts` | Update or delete one column |
| `src/services/projectService.ts` | Frontend service for project calls |
| `src/components/project/ProjectsClient.tsx` | Project card grid |
| `src/components/project/NewProjectDialog.tsx` | New project form |
| `src/components/project/ProjectDetailClient.tsx` | Board/List/Settings tab switcher |
| `src/components/project/BoardView.tsx` | Kanban board |
| `src/components/project/ListView.tsx` | Task list view |
| `src/components/project/ProjectSettings.tsx` | Project settings form |

## How It Works

1. The projects page asks the API for all projects in the workspace.
2. The create project form sends project details to the API.
3. The API saves the project in Prisma.
4. The API also creates a default board and four columns.
5. The detail page loads one project with its default board.
6. The board and list views show tasks from the board columns.
7. The settings form updates the project and can archive it.

### Standardized Project Data Structure
All project-related APIs have been refactored to use a clean, nested structure. Flat database fields have been grouped into a `projectInfo` object, and the database `id` is mapped to `project_id`. This standardized response format is globally typed in `src/types/index.ts`.

Example payload:
```json
{
  "project_id": "...",
  "workspaceId": "...",
  "projectInfo": {
    "name": "...",
    "description": "...",
    "status": "...",
    "color": "..."
  },
  "createdBy": { ... },
  "taskCount": 0
}
```

## API Table

### Projects

| Method | Route | What it does | Request body | Returns |
|---|---|---|---|---|
| `GET` | `/api/projects?workspaceId=[id]` | List projects in a workspace | Query: `workspaceId` | `{ projects: Project[], totalCount: number }` |
| `POST` | `/api/projects` | Create a project | Project fields | New structured `Project` |
| `GET` | `/api/projects/[projectId]?workspaceId=[id]` | Load one project | Query: `workspaceId` | Structured `Project` details |
| `PATCH` | `/api/projects/[projectId]` | Update project | Project fields + `workspaceId` | Updated `Project` |
| `DELETE` | `/api/projects/[projectId]?workspaceId=[id]` | Archive a project | Query: `workspaceId` | Archived `Project` |

### Boards and Columns

| Method | Route | What it does | Request body | Returns |
|---|---|---|---|---|
| `GET` | `/api/boards/[boardId]?workspaceId=[id]` | Load one board | Query: `workspaceId` | Board data |
| `POST` | `/api/boards/[boardId]/columns` | Add a column | `{ workspaceId, name, color?, taskLimit? }` | New column |
| `PATCH` | `/api/boards/[boardId]/columns` | Reorder columns | `{ workspaceId, columnIds }` | `{ success: true }` |
| `PATCH` | `/api/boards/[boardId]/columns/[columnId]` | Update a column | `{ workspaceId, name?, color?, taskLimit? }` | Updated column |
| `DELETE` | `/api/boards/[boardId]/columns/[columnId]?workspaceId=[id]` | Delete empty column | Query: `workspaceId` | `{ success: true }` |

## Rules

| Rule | Where it is checked |
|---|---|
| Project name is required | API route |
| Project status must be valid | API route |
| Column name cannot be empty | API route |
| Reorder IDs must belong to the board | API route |
| Empty columns can be deleted only if they have no tasks | API route |

## Done When

- project cards load correctly
- a new project creates its board and columns
- board columns and tasks show correctly
- column edits and reorder work
- empty columns can be deleted
