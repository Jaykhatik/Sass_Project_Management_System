import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AppError } from "@/lib/errors";

// PATCH /api/boards/[boardId]/columns/[columnId]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ boardId: string; columnId: string }> }
) {
  try {
    const { columnId } = await params;
    const body = await request.json();
    const { workspaceId, name, color, taskLimit } = body;

    if (!workspaceId || typeof workspaceId !== "string") {
      return NextResponse.json(
        { error: "workspaceId is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const existing = await prisma.column.findFirst({
      where: { id: columnId, workspaceId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Column not found", code: "NOT_FOUND" }, { status: 404 });
    }
    if (name !== undefined && (!String(name).trim())) {
      return NextResponse.json({ error: "Column name cannot be empty", code: "VALIDATION_ERROR" }, { status: 400 });
    }
    const column = await prisma.column.update({
      where: { id: columnId },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(color !== undefined && { color }),
        ...(taskLimit !== undefined && { taskLimit }),
      },
    });

    return NextResponse.json(column);
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

// DELETE /api/boards/[boardId]/columns/[columnId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ boardId: string; columnId: string }> }
) {
  try {
    const { columnId } = await params;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const column = await prisma.column.findFirst({
      where: { id: columnId, workspaceId },
      include: { _count: { select: { tasks: true } } },
    });
    if (!column) {
      return NextResponse.json({ error: "Column not found", code: "NOT_FOUND" }, { status: 404 });
    }
    if (column._count.tasks > 0) {
      return NextResponse.json(
        { error: "Cannot delete a column that contains tasks. Move or delete tasks first.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    await prisma.column.delete({ where: { id: columnId } });
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
