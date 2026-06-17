import axios from "axios";
import { Sprint } from "@/types";

export async function getSprints(workspaceId: string, projectId: string): Promise<Sprint[]> {
  const res = await axios.get(`/api/projects/${projectId}/sprints?workspaceId=${workspaceId}`);
  return res.data;
}

export async function createSprint(
  workspaceId: string,
  projectId: string,
  data: { name: string; goal?: string; startDate?: string | null; endDate?: string | null }
): Promise<Sprint> {
  const res = await axios.post(`/api/projects/${projectId}/sprints`, {
    workspaceId,
    ...data
  });
  return res.data;
}

export async function startSprint(
  workspaceId: string,
  sprintId: string,
  data: { startDate: string; endDate: string; goal?: string }
): Promise<Sprint> {
  const res = await axios.patch(`/api/sprints/${sprintId}`, {
    workspaceId,
    status: "active",
    ...data
  });
  return res.data;
}

export async function completeSprint(
  workspaceId: string,
  sprintId: string,
  incompleteAction: "move_to_backlog" | "move_to_next_sprint"
): Promise<Sprint> {
  const res = await axios.patch(`/api/sprints/${sprintId}`, {
    workspaceId,
    status: "completed",
    incompleteAction
  });
  return res.data;
}

export async function updateSprint(
  workspaceId: string,
  sprintId: string,
  data: Partial<Sprint>
): Promise<Sprint> {
  const res = await axios.patch(`/api/sprints/${sprintId}`, {
    workspaceId,
    ...data
  });
  return res.data;
}

export async function deleteSprint(workspaceId: string, sprintId: string): Promise<void> {
  await axios.delete(`/api/sprints/${sprintId}?workspaceId=${workspaceId}`);
}
