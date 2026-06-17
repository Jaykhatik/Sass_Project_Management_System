import axios from "axios";
import { WORKSPACE_API_ROUTES } from "./api/routes";
import { Workspace, WorkspaceMember } from "../types";

/**
 * Fetches workspace details by ID.
 * Used in: Various internal API routes and potentially server-side contexts.
 */
export const getWorkspace = async (
  workspaceId: string,
): Promise<Workspace> => {
  const res = await axios.get(
    `/api${WORKSPACE_API_ROUTES.workspaceById(workspaceId)}`,
  );
  return res.data as Workspace;
};

/**
 * Fetches workspace details by its URL slug.
 * Used in: Resolving workspaces during onboarding or public links.
 */
export const getWorkspaceBySlug = async (
  slug: string,
): Promise<Workspace> => {
  const res = await axios.get(`/api${WORKSPACE_API_ROUTES.workspaceBySlug(slug)}`);
  return res.data as Workspace;
};

/**
 * Retrieves all members belonging to a specific workspace.
 * Used in: `src/components/task/TaskModal.tsx` (for assigning users) & `src/app/(dashboard)/dashboard/members/page.tsx`
 */
export const getAllMembers = async (
  workspaceId: string,
): Promise<WorkspaceMember[]> => {
  const res = await axios.get(`/api${WORKSPACE_API_ROUTES.members(workspaceId)}`);
  return res.data as WorkspaceMember[];
};

/**
 * Updates the basic settings of a workspace (e.g., name).
 * Used in: `src/app/(dashboard)/dashboard/settings/SettingsClient.tsx`
 */
export const updateWorkspace = async (
  workspaceId: string,
  data: { name: string },
): Promise<Workspace> => {
  try {
    const response = await axios.patch(
      `/api${WORKSPACE_API_ROUTES.workspaceById(workspaceId)}`,
      data,
    );
    return response.data;
  } catch (error: unknown) {
    console.error("Error updating workspace:", error);
    const responseData =
      typeof error === "object" && error !== null && "response" in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data
        : undefined;
    throw new Error(
      responseData?.error || "Failed to update workspace settings",
    );
  }
};

/**
 * Updates a specific member's role within the workspace.
 * Used in: `src/app/(dashboard)/dashboard/members/page.tsx`
 */
export const updateMemberRole = async (
  workspaceId: string,
  userId: string,
  role: string,
): Promise<WorkspaceMember> => {
  try {
    const response = await axios.patch(
      `/api${WORKSPACE_API_ROUTES.memberById(workspaceId, userId)}`,
      { role },
    );
    return response.data;
  } catch (error: unknown) {
    console.error("Error updating member role:", error);
    const responseData =
      typeof error === "object" && error !== null && "response" in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data
        : undefined;
    throw new Error(responseData?.error || "Failed to update member role");
  }
};

/**
 * Removes a member from the workspace entirely.
 * Used in: `src/app/(dashboard)/dashboard/members/page.tsx`
 */
export const deleteMember = async (
  workspaceId: string,
  userId: string,
): Promise<{ success: boolean }> => {
  try {
    const response = await axios.delete(
      `/api${WORKSPACE_API_ROUTES.memberById(workspaceId, userId)}`,
    );
    return response.data;
  } catch (error: unknown) {
    console.error("Error removing member:", error);
    const responseData =
      typeof error === "object" && error !== null && "response" in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data
        : undefined;
    throw new Error(responseData?.error || "Failed to remove member");
  }
};

/**
 * Retrieves custom tags/labels specific to a workspace.
 * Used in: `src/components/task/TaskModal.tsx` & `src/app/(dashboard)/dashboard/settings/SettingsClient.tsx`
 */
export const getWorkspaceLabels = async (workspaceId: string) => {
  const res = await axios.get(`/api${WORKSPACE_API_ROUTES.labels(workspaceId)}`);
  return res.data;
};

/**
 * Creates a new custom label/tag for the workspace.
 * Used in: `src/app/(dashboard)/dashboard/settings/SettingsClient.tsx`
 */
export const createWorkspaceLabel = async (workspaceId: string, data: { name: string; color: string }) => {
  const res = await axios.post(`/api${WORKSPACE_API_ROUTES.labels(workspaceId)}`, data);
  return res.data;
};
