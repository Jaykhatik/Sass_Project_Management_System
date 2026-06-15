import { cookies } from "next/headers";
import { PROJECT_API_ROUTES } from "./api/routes";
import { WORKSPACE_API } from "./api";

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  return cookieHeader ? { Cookie: cookieHeader } : {};
};

export const getProjects = async (workspaceId: string) => {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${PROJECT_API_ROUTES.projects}?workspaceId=${workspaceId}`,
    {
      cache: "no-store",
      headers,
    },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch projects");
  }

  return res.json();
};

export const getProject = async (workspaceId: string, projectId: string) => {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${PROJECT_API_ROUTES.projectById(projectId)}?workspaceId=${workspaceId}`,
    {
      cache: "no-store",
      headers,
    },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch project");
  }

  return res.json();
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
