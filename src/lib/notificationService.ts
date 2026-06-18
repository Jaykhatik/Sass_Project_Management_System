import prisma from "@/lib/prisma";

interface CreateNotificationParams {
  workspaceId: string;
  userId: string;
  type: "task_assigned" | "mention" | "sprint_started" | "member_added" | "task_completed";
  title: string;
  body?: string;
  data?: any;
}

export async function notifyUser({
  workspaceId,
  userId,
  type,
  title,
  body,
  data,
}: CreateNotificationParams) {
  try {
    await prisma.notification.create({
      data: {
        workspaceId,
        userId,
        type,
        title,
        body,
        data: data ? JSON.parse(JSON.stringify(data)) : null,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    // Non-blocking
  }
}
