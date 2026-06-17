import axios from "axios";
import { PROJECT_API_ROUTES } from "./api/routes";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

/**
 * Creates a new project in the workspace.
 * Used in: `src/components/project/NewProjectDialog.tsx`
 */
export const createProject = async (data: {
  workspaceId: string;
  name: string;
  description?: string;
  color?: string;
}) => {
  try {
    const res = await axios.post(`${API_BASE}${PROJECT_API_ROUTES.projects}`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to create project");
  }
};

/**
 * Updates a project's details from a client component.
 * Used in: `src/components/project/ProjectSettings.tsx`
 */
export const updateProjectClient = async (
  projectId: string,
  data: Record<string, unknown> & { workspaceId: string },
) => {
  try {
    const res = await axios.patch(
      `${API_BASE}${PROJECT_API_ROUTES.projectById(projectId)}`,
      data
    );
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to update project");
  }
};

/**
 * Archives/deletes a project from the workspace.
 * Used in: `src/components/project/ProjectSettings.tsx`
 */
export const archiveProjectClient = async (
  projectId: string,
  workspaceId: string,
) => {
  try {
    const res = await axios.delete(
      `${API_BASE}${PROJECT_API_ROUTES.projectById(projectId)}?workspaceId=${workspaceId}`
    );
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to delete project");
  }
};
