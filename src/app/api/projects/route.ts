import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { getSessionUserWithRefresh } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/projects?workspaceId=xxx — list all projects
export async function GET(request: Request) {
  try {
    const user = await getSessionUserWithRefresh();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    const ownedWorkspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        ownerId: user.id,
      },
    });

    if (!membership && !ownedWorkspace) {
      return NextResponse.json(
        {
          error: "You do not have access to this workspace",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    const projects = await prisma.project.findMany({
      where: { workspaceId },
      include: {
        boards: {
          where: { isDefault: true },
          include: { _count: { select: { tasks: true } } },
        },
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: { select: { tasks: { where: { parentTaskId: null } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedProjects = projects.map((project) => ({
      project_id: project.id,
      workspaceId: project.workspaceId,
      projectInfo: {
        name: project.name,
        description: project.description,
        status: project.status,
        color: project.color,
        icon: project.icon,
        startDate: project.startDate,
        dueDate: project.dueDate,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      createdBy: project.createdBy,
      defaultBoardId: project.boards?.[0]?.id || null,
      taskCount: project._count?.tasks || 0,
    }));

    return NextResponse.json({
      projects: formattedProjects,
      totalCount: formattedProjects.length,
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

// POST /api/projects — create a new project
export async function POST(request: Request) {
  try {
    const user = await getSessionUserWithRefresh();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { workspaceId, name, description, color, startDate, dueDate } = body;

    if (!workspaceId || typeof workspaceId !== "string") {
      return NextResponse.json(
        { error: "workspaceId is required", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    const ownedWorkspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        ownerId: user.id,
      },
    });

    const isOwner = ownedWorkspace !== null || membership?.role === "owner";

    if (!isOwner) {
      return NextResponse.json(
        {
          error: "Only the workspace owner can create new projects.",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    const { project, boardId } = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          workspaceId,
          createdById: user.id,
          name: String(name || "").trim(),
          description:
            typeof description === "string" ? description.trim() : undefined,
          color: color ?? "#6366F1",
          startDate: startDate ? new Date(startDate) : undefined,
          dueDate: dueDate ? new Date(dueDate) : undefined,
        },
      });

      const board = await tx.board.create({
        data: {
          name: "Main Board",
          projectId: created.id,
          workspaceId,
          isDefault: true,
        },
      });

      await tx.column.createMany({
        data: [
          { name: "To Do", position: 0, boardId: board.id, workspaceId },
          { name: "In Progress", position: 1, boardId: board.id, workspaceId },
          { name: "In Review", position: 2, boardId: board.id, workspaceId },
          {
            name: "Done",
            position: 3,
            boardId: board.id,
            workspaceId,
            isDoneCol: true,
          },
        ],
      });

      return { project: created, boardId: board.id };
    });

    const responsePayload = {
      project_id: project.id,
      workspaceId: project.workspaceId,
      projectInfo: {
        name: project.name,
        description: project.description,
        status: project.status,
        color: project.color,
        icon: project.icon,
        startDate: project.startDate,
        dueDate: project.dueDate,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      createdBy: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      defaultBoardId: boardId,
      taskCount: 0,
    };

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
