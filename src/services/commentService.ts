import axios from "axios";
import { Comment } from "@/types";
import { TASK_API_ROUTES } from "./api/routes";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export async function getComments(workspaceId: string, taskId: string): Promise<Comment[]> {
  try {
    const res = await axios.get(`${API_BASE}${TASK_API_ROUTES.comments(taskId)}?workspaceId=${workspaceId}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to fetch comments");
  }
}

export async function createComment(workspaceId: string, taskId: string, content: string, parentId?: string): Promise<Comment> {
  try {
    const res = await axios.post(`${API_BASE}${TASK_API_ROUTES.comments(taskId)}`, {
      workspaceId,
      content,
      parentId
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to create comment");
  }
}

export async function updateComment(workspaceId: string, taskId: string, commentId: string, content: string): Promise<Comment> {
  try {
    const res = await axios.patch(`${API_BASE}${TASK_API_ROUTES.commentById(taskId, commentId)}`, {
      workspaceId,
      content
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to update comment");
  }
}

export async function deleteComment(workspaceId: string, taskId: string, commentId: string): Promise<void> {
  try {
    await axios.delete(`${API_BASE}${TASK_API_ROUTES.commentById(taskId, commentId)}?workspaceId=${workspaceId}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to delete comment");
  }
}
