import axios from "axios";
import { WORKSPACE_API_ROUTES } from "./api/routes";

export interface SearchResults {
  tasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    project: { id: string; name: string } | null;
  }[];
  projects: {
    id: string;
    name: string;
    status: string;
  }[];
  members: {
    id: string;
    role: string;
    user: { id: string; name: string; email: string; avatarUrl: string | null };
  }[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export async function globalSearch(workspaceId: string, query: string): Promise<SearchResults> {
  try {
    const response = await axios.get(`${API_BASE}${WORKSPACE_API_ROUTES.search(workspaceId)}?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to perform global search");
  }
}
