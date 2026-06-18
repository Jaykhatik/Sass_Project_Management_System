import axios from "axios";
import { WORKSPACE_API_ROUTES } from "./api/routes";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export interface AnalyticsData {
  summary: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    totalMembers: number;
  };
  projectsByStatus: { name: string; value: number }[];
  tasksByStatus: { name: string; value: number }[];
  tasksByPriority: { name: string; value: number }[];
  tasksByUser: { name: string; assigned: number; completed: number }[];
}

export async function getWorkspaceAnalytics(workspaceId: string): Promise<AnalyticsData> {
  try {
    const response = await axios.get(`${API_BASE}${WORKSPACE_API_ROUTES.analytics(workspaceId)}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to fetch analytics");
  }
}
