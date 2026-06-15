export const WORKSPACE_API_ROUTES = {
  workspaces: "/workspaces",
  workspaceById: (id: string) => `/workspaces/${id}`,
  workspaceBySlug: (slug: string) => `/workspaces/by-slug/${slug}`,
  members: (workspaceId: string) => `/workspaces/${workspaceId}/members`,
  memberById: (workspaceId: string, userId: string) =>
    `/workspaces/${workspaceId}/members/${userId}`,
};

export const PROJECT_API_ROUTES = {
  projects: "/projects",
  projectById: (projectId: string) => `/projects/${projectId}`,
};
