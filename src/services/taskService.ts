import { Task } from "@/types";
import axios from "axios";
import { PROJECT_API_ROUTES, TASK_API_ROUTES } from "./api/routes";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

/**
 * Creates a new task.
 * Used in: `src/components/task/CreateTaskDialog.tsx`
 */
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
  try {
    const res = await axios.post(`${API_BASE}${TASK_API_ROUTES.tasks}`, data);
    return res.data as Task;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to create task");
  }
};

/**
 * Updates properties of an existing task (status, assignees, labels, etc).
 * Used in: `src/components/project/BoardView.tsx`, `src/components/task/TaskModal.tsx`, `src/app/(dashboard)/dashboard/tasks/MyTasksClient.tsx`
 */
export const updateTask = async (taskId: string, data: Partial<Task> & { workspaceId: string; assigneeIds?: string[]; labelIds?: string[] }) => {
  try {
    const res = await axios.patch(`${API_BASE}${TASK_API_ROUTES.taskById(taskId)}`, data);
    return res.data as Task;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to update task");
  }
};

/**
 * Deletes a task from the system.
 * Used in: `src/components/task/TaskModal.tsx`, `src/app/(dashboard)/dashboard/tasks/MyTasksClient.tsx`
 */
export const deleteTask = async (taskId: string, workspaceId: string) => {
  try {
    const res = await axios.delete(`${API_BASE}${TASK_API_ROUTES.taskById(taskId)}?workspaceId=${workspaceId}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to delete task");
  }
};

/**
 * Reorders tasks within a kanban board column or between columns.
 * Used in: `src/components/project/BoardView.tsx`
 */
export const reorderTasks = async (
  boardId: string,
  workspaceId: string,
  tasks: { id: string; columnId: string; position: number }[]
) => {
  try {
    const res = await axios.patch(`${API_BASE}${TASK_API_ROUTES.reorder(boardId)}`, { workspaceId, tasks });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to reorder tasks");
  }
};

/**
 * Fetches the complete details of a single task.
 * Used in: `src/components/task/TaskModal.tsx`
 */
export const getTaskById = async (taskId: string, workspaceId: string) => {
  try {
    const res = await axios.get(`${API_BASE}${TASK_API_ROUTES.taskById(taskId)}?workspaceId=${workspaceId}`);
    return res.data as Task;
  } catch (error: any) {
    throw new Error("Failed to fetch task");
  }
};

/**
 * Fetches all tasks, optionally filtering by assignee.
 * Used in: `src/app/(dashboard)/dashboard/tasks/MyTasksClient.tsx`
 */
export const getAllTasks = async (workspaceId: string, assigneeId?: string) => {
  const url = assigneeId 
    ? `${API_BASE}${TASK_API_ROUTES.tasks}?workspaceId=${workspaceId}&assigneeId=${assigneeId}`
    : `${API_BASE}${TASK_API_ROUTES.tasks}?workspaceId=${workspaceId}`;
  try {
    const res = await axios.get(url);
    return res.data as Task[];
  } catch (error: any) {
    throw new Error("Failed to fetch tasks");
  }
};

/**
 * Creates a nested subtask under a parent task.
 * Used in: `src/components/task/TaskModal.tsx`
 */
export const createSubtask = async (taskId: string, data: { title: string; priority?: string; status?: string }) => {
  try {
    const res = await axios.post(`${API_BASE}${TASK_API_ROUTES.subtasks(taskId)}`, data);
    return res.data as Task;
  } catch (error: any) {
    throw new Error("Failed to create subtask");
  }
};

/**
 * Adds a blocking dependency to a task.
 * Used in: `src/components/task/TaskModal.tsx`
 */
export const addDependency = async (taskId: string, dependentTaskId: string) => {
  try {
    const res = await axios.post(`${API_BASE}${TASK_API_ROUTES.dependencies(taskId)}`, { dependentTaskId });
    return res.data as Task;
  } catch (error: any) {
    throw new Error("Failed to add dependency");
  }
};

