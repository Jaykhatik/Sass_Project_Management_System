import { WORKSPACE_API } from "./api";
import { WORKSPACE_API_ROUTES } from "./api/routes";
import { Workspace, WorkspaceMember } from "../types";

export const getWorkspace = async (
  workspaceId: string,
): Promise<Workspace> => {
  const res = await WORKSPACE_API.get(
    WORKSPACE_API_ROUTES.workspaceById(workspaceId),
  );
  return res.data as Workspace;
};

export const getWorkspaceBySlug = async (
  slug: string,
): Promise<Workspace> => {
  const res = await WORKSPACE_API.get(WORKSPACE_API_ROUTES.workspaceBySlug(slug));
  return res.data as Workspace;
};

export const getAllMembers = async (
  workspaceId: string,
): Promise<WorkspaceMember[]> => {
  const res = await WORKSPACE_API.get(WORKSPACE_API_ROUTES.members(workspaceId));
  return res.data as WorkspaceMember[];
};

export const updateWorkspace = async (
  workspaceId: string,
  data: { name: string },
): Promise<Workspace> => {
  try {
    const response = await WORKSPACE_API.patch(
      WORKSPACE_API_ROUTES.workspaceById(workspaceId),
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

export const updateMemberRole = async (
  workspaceId: string,
  userId: string,
  role: string,
): Promise<WorkspaceMember> => {
  try {
    const response = await WORKSPACE_API.patch(
      WORKSPACE_API_ROUTES.memberById(workspaceId, userId),
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

export const deleteMember = async (
  workspaceId: string,
  userId: string,
): Promise<{ success: boolean }> => {
  try {
    const response = await WORKSPACE_API.delete(
      WORKSPACE_API_ROUTES.memberById(workspaceId, userId),
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
