export const WORKSPACE_API_ROUTES = {
  workspaces: "/workspaces",
  workspaceById: (id: string) => `/workspaces/${id}`,
  workspaceBySlug: (slug: string) => `/workspaces/by-slug/${slug}`,
  members: (workspaceId: string) => `/workspaces/${workspaceId}/members`,
  memberById: (workspaceId: string, userId: string) =>
    `/workspaces/${workspaceId}/members/${userId}`,
  labels: (workspaceId: string) => `/workspaces/${workspaceId}/labels`,
  activity: (workspaceId: string) => `/workspaces/${workspaceId}/activity`,
  notifications: (workspaceId: string) => `/workspaces/${workspaceId}/notifications`,
  notificationById: (workspaceId: string, notificationId: string) => `/workspaces/${workspaceId}/notifications/${notificationId}`,
  search: (workspaceId: string) => `/workspaces/${workspaceId}/search`,
  analytics: (workspaceId: string) => `/workspaces/${workspaceId}/analytics`,
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
  me: "/auth/me",
};

export const TASK_API_ROUTES = {
  tasks: "/tasks",
  taskById: (taskId: string) => `/tasks/${taskId}`,
  subtasks: (taskId: string) => `/tasks/${taskId}/subtasks`,
  dependencies: (taskId: string) => `/tasks/${taskId}/dependencies`,
  reorder: (boardId: string) => `/boards/${boardId}/tasks/reorder`,
  comments: (taskId: string) => `/tasks/${taskId}/comments`,
  commentById: (taskId: string, commentId: string) => `/tasks/${taskId}/comments/${commentId}`,
  attachments: (taskId: string) => `/tasks/${taskId}/attachments`,
  attachmentById: (taskId: string, attachmentId: string) => `/tasks/${taskId}/attachments/${attachmentId}`,
};

export const BOARD_API_ROUTES = {
  columns: (boardId: string) => `/boards/${boardId}/columns`,
};

export const SPRINT_API_ROUTES = {
  sprintsByProject: (projectId: string) => `/projects/${projectId}/sprints`,
  sprintById: (sprintId: string) => `/sprints/${sprintId}`,
};
