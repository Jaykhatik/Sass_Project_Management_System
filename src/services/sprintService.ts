import axios from "axios";
import { Sprint } from "@/types";
import { SPRINT_API_ROUTES } from "./api/routes";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export async function getSprints(
  workspaceId: string,
  projectId: string,
): Promise<Sprint[]> {
  try {
    const res = await axios.get(
      `${API_BASE}${SPRINT_API_ROUTES.sprintsByProject(projectId)}?workspaceId=${workspaceId}`,
    );
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to fetch sprints");
  }
}

export async function createSprint(
  workspaceId: string,
  projectId: string,
  data: {
    name: string;
    goal?: string;
    startDate?: string | null;
    endDate?: string | null;
  },
): Promise<Sprint> {
  try {
    const res = await axios.post(
      `${API_BASE}${SPRINT_API_ROUTES.sprintsByProject(projectId)}`,
      {
        workspaceId,
        ...data,
      },
    );
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to create sprint");
  }
}

export async function startSprint(
  workspaceId: string,
  sprintId: string,
  data: { startDate: string; endDate: string; goal?: string },
): Promise<Sprint> {
  try {
    const res = await axios.patch(
      `${API_BASE}${SPRINT_API_ROUTES.sprintById(sprintId)}`,
      {
        workspaceId,
        status: "active",
        ...data,
      },
    );
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to start sprint");
  }
}

export async function completeSprint(
  workspaceId: string,
  sprintId: string,
  incompleteAction: "move_to_backlog" | "move_to_next_sprint",
): Promise<Sprint> {
  try {
    const res = await axios.patch(
      `${API_BASE}${SPRINT_API_ROUTES.sprintById(sprintId)}`,
      {
        workspaceId,
        status: "completed",
        incompleteAction,
      },
    );
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to complete sprint");
  }
}

export async function updateSprint(
  workspaceId: string,
  sprintId: string,
  data: Partial<Sprint>,
): Promise<Sprint> {
  try {
    const res = await axios.patch(
      `${API_BASE}${SPRINT_API_ROUTES.sprintById(sprintId)}`,
      {
        workspaceId,
        ...data,
      },
    );
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to update sprint");
  }
}

export async function deleteSprint(
  workspaceId: string,
  sprintId: string,
): Promise<void> {
  try {
    await axios.delete(
      `${API_BASE}${SPRINT_API_ROUTES.sprintById(sprintId)}?workspaceId=${workspaceId}`,
    );
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to delete sprint");
  }
}
