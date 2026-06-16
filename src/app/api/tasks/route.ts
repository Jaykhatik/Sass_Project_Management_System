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
    const { workspaceId, projectId, boardId, columnId, title, description, priority, dueDate, parentTaskId } = body;

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

    // Determine the position for the new task (bottom of the column) if it's a root task
    let newPosition = 1024;
    if (columnId) {
      const maxPositionTask = await prisma.task.findFirst({
        where: { columnId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      if (maxPositionTask) newPosition = maxPositionTask.position + 1024;
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        workspaceId,
        projectId,
        boardId,
        columnId,
        parentTaskId,
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

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const projectId = searchParams.get("projectId");
    const assigneeId = searchParams.get("assigneeId");
    const q = searchParams.get("q");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
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

    // Build the query dynamically
    const whereClause: any = { workspaceId, parentTaskId: null };
    
    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (assigneeId) {
      whereClause.assignees = {
        some: { userId: assigneeId }
      };
    }

    if (q) {
      whereClause.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Fetch tasks
    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignees: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } }
          }
        },
        labels: {
          include: { label: true }
        },
        project: {
          select: { id: true, name: true }
        },
        subTasks: {
          select: { id: true, title: true, status: true },
          orderBy: { createdAt: "asc" }
        },
        blockedBy: { select: { blockerTaskId: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

