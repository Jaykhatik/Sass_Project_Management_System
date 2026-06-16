import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { taskId } = await params;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId },
      include: {
        assignees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        labels: { include: { label: true } },
        column: { select: { id: true, name: true } },
        subTasks: { select: { id: true, title: true, status: true, priority: true } }
      }
    });

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { taskId } = await params;
    const body = await request.json();
    const { workspaceId, title, description, priority, status, dueDate, columnId, assigneeIds, estimatedHours, actualHours, storyPoints, parentTaskId, labelIds } = body;

    if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

    // Validate user is in workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });
    if (!membership && workspaceId !== (await prisma.workspace.findUnique({ where: { id: workspaceId } }))?.ownerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If assigneeIds is provided, we delete existing assignees and recreate them
    let assigneesUpdate = {};
    if (assigneeIds !== undefined && Array.isArray(assigneeIds)) {
      assigneesUpdate = {
        assignees: {
          deleteMany: {},
          create: assigneeIds.map((userId: string) => ({
            userId,
            assignedBy: user.id
          }))
        }
      };
    }

    let labelsUpdate = {};
    if (labelIds !== undefined && Array.isArray(labelIds)) {
      labelsUpdate = {
        labels: {
          deleteMany: {},
          create: labelIds.map((labelId: string) => ({
            labelId
          }))
        }
      };
    }

    let finalColumnId = columnId;
    if (status !== undefined && columnId === undefined) {
      const currentTask = await prisma.task.findUnique({
        where: { id: taskId },
        select: { boardId: true }
      });
      if (currentTask?.boardId) {
        const boardColumns = await prisma.column.findMany({
          where: { boardId: currentTask.boardId },
          orderBy: { position: "asc" }
        });
        
        if (boardColumns.length > 0) {
          let targetCol = boardColumns[0];
          if (status === "done" || status === "completed") {
            targetCol = boardColumns[boardColumns.length - 1];
          } else if (status === "in_progress") {
            targetCol = boardColumns.find(c => c.name.toLowerCase().includes("progress")) || boardColumns[1] || boardColumns[0];
          } else if (status === "in_review") {
            targetCol = boardColumns.find(c => c.name.toLowerCase().includes("review")) || boardColumns[boardColumns.length - 2] || boardColumns[0];
          }
          finalColumnId = targetCol.id;
        }
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(priority !== undefined && { priority }),
        ...(status !== undefined && { status }),
        ...(finalColumnId !== undefined && { columnId: finalColumnId }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(estimatedHours !== undefined && { estimatedHours }),
        ...(actualHours !== undefined && { actualHours }),
        ...(storyPoints !== undefined && { storyPoints }),
        ...(parentTaskId !== undefined && { parentTaskId }),
        ...assigneesUpdate,
        ...labelsUpdate
      },
      include: {
        assignees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        labels: { include: { label: true } },
        column: { select: { id: true, name: true } },
        subTasks: { select: { id: true, title: true, status: true, priority: true } }
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { taskId } = await params;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });
    if (!membership && workspaceId !== (await prisma.workspace.findUnique({ where: { id: workspaceId } }))?.ownerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
