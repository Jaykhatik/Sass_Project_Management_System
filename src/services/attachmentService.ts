import axios from "axios";
import { Attachment } from "@/types";
import { TASK_API_ROUTES } from "./api/routes";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export async function getAttachments(taskId: string): Promise<Attachment[]> {
  try {
    const res = await axios.get(`${API_BASE}${TASK_API_ROUTES.attachments(taskId)}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to fetch attachments");
  }
}

export async function uploadAttachment(taskId: string, file: File): Promise<Attachment> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    
    const res = await axios.post(`${API_BASE}${TASK_API_ROUTES.attachments(taskId)}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to upload file");
  }
}

export async function deleteAttachment(taskId: string, attachmentId: string): Promise<void> {
  try {
    await axios.delete(`${API_BASE}${TASK_API_ROUTES.attachmentById(taskId, attachmentId)}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to delete attachment");
  }
}
