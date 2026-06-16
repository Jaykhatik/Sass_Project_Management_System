import { Task } from "@/types";
import { PROJECT_API_ROUTES } from "./api/routes";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export const createTask = async (data: {
  workspaceId: string;
  projectId: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string | null;
}) => {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create task");
  }
  return res.json() as Promise<Task>;
};

export const updateTask = async (taskId: string, data: Partial<Task> & { workspaceId: string; assigneeIds?: string[] }) => {
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update task");
  }
  return res.json() as Promise<Task>;
};

export const deleteTask = async (taskId: string, workspaceId: string) => {
  const res = await fetch(`${API_BASE}/tasks/${taskId}?workspaceId=${workspaceId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to delete task");
  }
  return res.json() as Promise<{ success: boolean }>;
};

export const reorderTasks = async (
  boardId: string,
  workspaceId: string,
  tasks: { id: string; columnId: string; position: number }[]
) => {
  const res = await fetch(`${API_BASE}/boards/${boardId}/tasks/reorder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, tasks }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to reorder tasks");
  }
  return res.json() as Promise<{ success: boolean }>;
};
