import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AppError } from "@/lib/errors";

// GET /api/projects?workspaceId=xxx — list all projects
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const projects = await prisma.project.findMany({
      where: { workspaceId },
      include: {
        boards: {
          where: { isDefault: true },
          include: { _count: { select: { tasks: true } } },
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projects);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/projects — create a new project
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workspaceId, userId, name, description, color, startDate, dueDate } = body;

    if (!workspaceId || typeof workspaceId !== "string") {
      return NextResponse.json(
        { error: "workspaceId is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Hardcode userId for now (Phase 14 will add auth)
    const creatorId = userId || "00000000-0000-0000-0000-000000000000";

    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          workspaceId,
          createdById: creatorId,
          name: String(name || "").trim(),
          description: typeof description === "string" ? description.trim() : undefined,
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
          { name: "Done", position: 3, boardId: board.id, workspaceId, isDoneCol: true },
        ],
      });

      return created;
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
