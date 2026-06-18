import axios from "axios";
import { WORKSPACE_API_ROUTES } from "./api/routes";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export interface Notification {
  id: string;
  workspaceId: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  data: any | null;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(workspaceId: string): Promise<Notification[]> {
  try {
    const res = await axios.get(`${API_BASE}${WORKSPACE_API_ROUTES.notifications(workspaceId)}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to fetch notifications");
  }
}

export async function markAllAsRead(workspaceId: string): Promise<void> {
  try {
    await axios.patch(`${API_BASE}${WORKSPACE_API_ROUTES.notifications(workspaceId)}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to mark notifications as read");
  }
}

export async function markAsRead(workspaceId: string, notificationId: string): Promise<void> {
  try {
    await axios.patch(`${API_BASE}${WORKSPACE_API_ROUTES.notificationById(workspaceId, notificationId)}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to mark notification as read");
  }
}

export async function deleteNotification(workspaceId: string, notificationId: string): Promise<void> {
  try {
    await axios.delete(`${API_BASE}${WORKSPACE_API_ROUTES.notificationById(workspaceId, notificationId)}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to delete notification");
  }
}
