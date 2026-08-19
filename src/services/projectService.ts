import axios from "axios";
import { cookies } from "next/headers";
import { PROJECT_API_ROUTES } from "./api/routes";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  return cookieHeader ? { Cookie: cookieHeader } : {};
};

/**
 * Fetches all projects for a given workspace.
 * Used in: `src/app/(dashboard)/dashboard/projects/page.tsx` (Server Component)
 */
export const getProjects = async (workspaceId: string) => {
  const headers = await getAuthHeaders();
  try {
    const res = await axios.get(
      `${API_BASE}${PROJECT_API_ROUTES.projects}?workspaceId=${workspaceId}`,
      { headers },
    );
    return res.data;
  } catch (error: any) {
    throw new Error("Failed to fetch projects");
  }
};

/**
 * Fetches a single project by its ID.
 * Used in: `src/app/(dashboard)/dashboard/projects/[projectId]/page.tsx` (Server Component)
 */
export const getProject = async (workspaceId: string, projectId: string) => {
  const headers = await getAuthHeaders();
  try {
    const res = await axios.get(
      `${API_BASE}${PROJECT_API_ROUTES.projectById(projectId)}?workspaceId=${workspaceId}`,
      {
        headers: {
          ...headers,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
    return res.data;
  } catch (error: any) {
    throw new Error("Failed to fetch project");
  }
};

/**
 * Updates a project (Server-side context).
 * Note: Use `projectClientService.ts` for Client Components.
 */
export const updateProject = async (
  projectId: string,
  data: Record<string, unknown> & { workspaceId: string },
) => {
  const headers = await getAuthHeaders();
  try {
    const res = await axios.patch(
      `${API_BASE}${PROJECT_API_ROUTES.projectById(projectId)}`,
      data,
      { headers },
    );
    return res.data;
  } catch (error: any) {
    throw new Error("Failed to update project");
  }
};

/**
 * Archives a project (Server-side context).
 * Note: Use `projectClientService.ts` for Client Components.
 */
export const archiveProject = async (
  projectId: string,
  workspaceId: string,
) => {
  const headers = await getAuthHeaders();
  try {
    const res = await axios.delete(
      `${API_BASE}${PROJECT_API_ROUTES.projectById(projectId)}?workspaceId=${workspaceId}`,
      { headers },
    );
    return res.data;
  } catch (error: any) {
    throw new Error("Failed to archive project");
  }
};
