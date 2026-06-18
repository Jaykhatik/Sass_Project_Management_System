import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUserWithRefresh } from "@/lib/auth";
import { logActivity } from "@/lib/activityLogger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await getSessionUserWithRefresh();
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
    const user = await getSessionUserWithRefresh();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { taskId } = await params;
    const body = await request.json();
    const { workspaceId, title, description, priority, status, dueDate, columnId, assigneeIds, estimatedHours, actualHours, storyPoints, parentTaskId, labelIds } = body;

    if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

    // Validate user is in workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });
    
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    const isOwner = workspace?.ownerId === user.id;

    if (!membership && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Authorization: User must be the Owner or assigned to the task
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignees: true }
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const isAssignee = existingTask.assignees.some((a: any) => a.userId === user.id);

    if (!isOwner && !isAssignee) {
      return NextResponse.json({ error: "Only assigned members or the workspace owner can update this task" }, { status: 403 });
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

      // Cascade assignee updates to subtasks
      const subtasks = await prisma.task.findMany({ where: { parentTaskId: taskId } });
      if (subtasks.length > 0) {
        for (const st of subtasks) {
          await prisma.task.update({
            where: { id: st.id },
            data: {
              assignees: {
                deleteMany: {},
                create: assigneeIds.map((userId: string) => ({
                  userId,
                  assignedBy: user.id
                }))
              }
            }
          });
        }
      }
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

    const existingTaskData = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!existingTaskData) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (status === "done" || status === "completed") {
      const incompleteSubtasks = await prisma.task.count({
        where: { parentTaskId: taskId, status: { notIn: ["done", "completed"] } }
      });

      if (incompleteSubtasks > 0) {
        return NextResponse.json({ error: `Cannot complete task: ${incompleteSubtasks} subtask(s) still pending.` }, { status: 400 });
      }
    }

    let finalColumnId = columnId;
    if (status !== undefined && columnId === undefined) {
      if (existingTaskData.boardId) {
        const boardColumns = await prisma.column.findMany({
          where: { boardId: existingTaskData.boardId },
          orderBy: { position: "asc" }
        });
        
        if (boardColumns.length > 0) {
          let targetCol = boardColumns[0];
          if (status === "done" || status === "completed") {
            targetCol = boardColumns.find(c => c.isDoneCol || c.name.toLowerCase().includes("done") || c.name.toLowerCase().includes("complete")) || boardColumns[boardColumns.length - 1];
          } else if (status === "in_progress") {
            targetCol = boardColumns.find(c => c.name.toLowerCase().includes("progress")) || boardColumns[1] || boardColumns[0];
          } else if (status === "in_review") {
            targetCol = boardColumns.find(c => c.name.toLowerCase().includes("review") || c.name.toLowerCase().includes("qa")) || boardColumns[boardColumns.length - 2] || boardColumns[0];
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
        ...(body.sprintId !== undefined && { sprintId: body.sprintId }),
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

    // Check if any actual scalar values changed
    let hasChanges = false;
    const keysToCheck = ["title", "description", "priority", "status", "columnId", "estimatedHours", "actualHours", "storyPoints", "parentTaskId", "sprintId"];
    
    for (const key of keysToCheck) {
      if ((updated as any)[key] !== (existingTaskData as any)[key]) {
        hasChanges = true;
        break;
      }
    }
    
    // Dates need special comparison
    if (updated.dueDate?.getTime() !== existingTaskData.dueDate?.getTime()) {
      hasChanges = true;
    }
    
    // Assignees or Labels might have changed
    if (assigneeIds !== undefined || labelIds !== undefined) {
      hasChanges = true;
    }

    if (hasChanges) {
      await logActivity(
        workspaceId,
        user.id,
        "task",
        taskId,
        "updated",
        existingTaskData,
        updated
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Task Update Error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await getSessionUserWithRefresh();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { taskId } = await params;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    const isOwner = workspace?.ownerId === user.id;

    if (!isOwner) {
      return NextResponse.json({ error: "Only the workspace owner can delete tasks" }, { status: 403 });
    }

    // Delete subtasks first to avoid foreign key constraints
    await prisma.task.deleteMany({ where: { parentTaskId: taskId } });
    await prisma.task.delete({ where: { id: taskId } });

    await logActivity(
      workspaceId,
      user.id,
      "task",
      taskId,
      "deleted"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
