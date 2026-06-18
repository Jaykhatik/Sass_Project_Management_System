import prisma from "@/lib/prisma";

export async function logActivity(
  workspaceId: string,
  actorId: string | null,
  entityType: string,
  entityId: string,
  action: string,
  beforeData?: any,
  afterData?: any
) {
  try {
    await prisma.activityLog.create({
      data: {
        workspaceId,
        actorId,
        entityType,
        entityId,
        action,
        beforeData: beforeData ? JSON.parse(JSON.stringify(beforeData)) : null,
        afterData: afterData ? JSON.parse(JSON.stringify(afterData)) : null,
      }
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Non-blocking error - we don't want to crash the main request if logging fails
  }
}
