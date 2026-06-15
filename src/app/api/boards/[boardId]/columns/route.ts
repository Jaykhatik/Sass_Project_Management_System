import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AppError } from "@/lib/errors";

// POST /api/boards/[boardId]/columns — add a column
export async function POST(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    const body = await request.json();
    const { workspaceId, name, color, taskLimit } = body;

    if (!workspaceId || typeof workspaceId !== "string") {
      return NextResponse.json(
        { error: "workspaceId is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Column name is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const lastColumn = await prisma.column.findFirst({
      where: { boardId, workspaceId },
      orderBy: { position: "desc" },
    });
    const column = await prisma.column.create({
      data: {
        boardId,
        workspaceId,
        name: name.trim(),
        color,
        taskLimit,
        position: lastColumn ? lastColumn.position + 1 : 0,
      },
    });

    return NextResponse.json(column, { status: 201 });
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

// PATCH /api/boards/[boardId]/columns — reorder columns
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    const body = await request.json();
    const { workspaceId, columnIds } = body;

    if (!workspaceId || typeof workspaceId !== "string") {
      return NextResponse.json(
        { error: "workspaceId is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (!Array.isArray(columnIds)) {
      return NextResponse.json(
        { error: "columnIds must be an array", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const columns = await prisma.column.findMany({ where: { boardId, workspaceId } });
    const existingIds = new Set(columns.map((c) => c.id));
    if (!columnIds.every((id) => existingIds.has(id))) {
      return NextResponse.json({ error: "Invalid column IDs provided", code: "VALIDATION_ERROR" }, { status: 400 });
    }
    await prisma.$transaction(
      columnIds.map((id, index) =>
        prisma.column.update({ where: { id }, data: { position: index } })
      )
    );
    const result = { success: true };
    return NextResponse.json(result);
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
