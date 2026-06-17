export const WORKSPACE_API_ROUTES = {
  workspaces: "/workspaces",
  workspaceById: (id: string) => `/workspaces/${id}`,
  workspaceBySlug: (slug: string) => `/workspaces/by-slug/${slug}`,
  members: (workspaceId: string) => `/workspaces/${workspaceId}/members`,
  memberById: (workspaceId: string, userId: string) =>
    `/workspaces/${workspaceId}/members/${userId}`,
  labels: (workspaceId: string) => `/workspaces/${workspaceId}/labels`,
};

export const PROJECT_API_ROUTES = {
  projects: "/projects",
  projectById: (projectId: string) => `/projects/${projectId}`,
};

export const AUTH_API_ROUTES = {
  login: "/auth/login",
  register: "/auth/register",
  logout: "/auth/logout",
  refresh: "/auth/refresh",
};

export const TASK_API_ROUTES = {
  tasks: "/tasks",
  taskById: (taskId: string) => `/tasks/${taskId}`,
  subtasks: (taskId: string) => `/tasks/${taskId}/subtasks`,
  dependencies: (taskId: string) => `/tasks/${taskId}/dependencies`,
  reorder: (boardId: string) => `/boards/${boardId}/tasks/reorder`,
};

export const BOARD_API_ROUTES = {
  columns: (boardId: string) => `/boards/${boardId}/columns`,
};

export const SPRINT_API_ROUTES = {
  sprintsByProject: (projectId: string) => `/projects/${projectId}/sprints`,
  sprintById: (sprintId: string) => `/sprints/${sprintId}`,
};
