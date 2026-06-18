import axios from "axios";
import { ActivityLog } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export async function getTaskActivity(workspaceId: string, taskId: string): Promise<ActivityLog[]> {
  try {
    const res = await axios.get(`${API_BASE}/tasks/${taskId}/activity?workspaceId=${workspaceId}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to fetch task activity");
  }
}

export async function getWorkspaceActivity(workspaceId: string, projectId?: string, memberId?: string): Promise<ActivityLog[]> {
  try {
    const params = new URLSearchParams();
    if (projectId) params.append("projectId", projectId);
    if (memberId) params.append("memberId", memberId);

    const res = await axios.get(`${API_BASE}/workspaces/${workspaceId}/activity?${params.toString()}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to fetch workspace activity");
  }
}
