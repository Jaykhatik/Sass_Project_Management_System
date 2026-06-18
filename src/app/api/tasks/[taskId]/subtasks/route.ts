import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { taskId } = await params;
    const body = await request.json();
    const { title, priority, status } = body;

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    // Validate the parent task exists and get its workspace info
    const parentTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { workspaceId: true, projectId: true, boardId: true, columnId: true, assignees: true }
    });

    if (!parentTask) {
      return NextResponse.json({ error: "Parent task not found" }, { status: 404 });
    }

    // Verify workspace access
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: parentTask.workspaceId, userId: user.id } },
    });
    
    if (!membership && parentTask.workspaceId !== (await prisma.workspace.findUnique({ where: { id: parentTask.workspaceId } }))?.ownerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create the sub-task
    const subTask = await prisma.task.create({
      data: {
        title,
        priority: priority || "none",
        status: status || "todo",
        parentTaskId: taskId,
        workspaceId: parentTask.workspaceId,
        projectId: parentTask.projectId,
        boardId: parentTask.boardId,
        columnId: parentTask.columnId,
        createdById: user.id,
        assignees: {
          create: parentTask.assignees.map((a: any) => ({
            userId: a.userId,
            assignedBy: user.id
          }))
        }
      }
    });

    return NextResponse.json(subTask, { status: 201 });
  } catch (error) {
    console.error("Failed to create sub-task:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
