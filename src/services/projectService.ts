import { PROJECT_API_ROUTES } from "./api/routes";
import { WORKSPACE_API } from "./api";

export const getProjects = async (workspaceId: string) => {
  const res = await WORKSPACE_API.get(
    `${PROJECT_API_ROUTES.projects}?workspaceId=${workspaceId}`,
  );
  return res.data;
};

export const getProject = async (workspaceId: string, projectId: string) => {
  const res = await WORKSPACE_API.get(
    `${PROJECT_API_ROUTES.projectById(projectId)}?workspaceId=${workspaceId}`,
  );
  return res.data;
};

export const updateProject = async (
  projectId: string,
  data: Record<string, unknown> & { workspaceId: string },
) => {
  const res = await WORKSPACE_API.patch(
    PROJECT_API_ROUTES.projectById(projectId),
    data,
  );
  return res.data;
};

export const archiveProject = async (
  projectId: string,
  workspaceId: string,
) => {
  const res = await WORKSPACE_API.delete(
    `${PROJECT_API_ROUTES.projectById(projectId)}?workspaceId=${workspaceId}`,
  );
  return res.data;
};
