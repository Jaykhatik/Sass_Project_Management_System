import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, projectId, boardId, columnId, title, description, priority, dueDate } = body;

    if (!workspaceId || !projectId || !boardId || !columnId || !title) {
      return NextResponse.json(
        { error: "Missing required fields for task creation" },
        { status: 400 }
      );
    }

    // Security check: ensure user is part of the workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership && workspaceId !== (await prisma.workspace.findUnique({ where: { id: workspaceId } }))?.ownerId) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Determine the position for the new task (bottom of the column)
    const maxPositionTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const newPosition = maxPositionTask ? maxPositionTask.position + 1024 : 1024; // Use large spacing to allow dropping between later

    // Create the task
    const task = await prisma.task.create({
      data: {
        workspaceId,
        projectId,
        boardId,
        columnId,
        title,
        description,
        priority: priority || "medium",
        status: "todo", // Default status, though it should ideally match the column's semantic meaning if needed
        position: newPosition,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: user.id,
      },
      include: {
        assignees: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } }
          }
        },
        labels: {
          include: { label: true }
        }
      }
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
