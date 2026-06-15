import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AppError } from "@/lib/errors";

// GET /api/boards/[boardId]?workspaceId=xxx
export async function GET(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const board = await prisma.board.findFirst({
      where: { id: boardId, workspaceId },
      include: {
        columns: {
          orderBy: { position: "asc" },
          include: {
            tasks: {
              orderBy: { position: "asc" },
              include: {
                assignees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
                labels: { include: { label: true } },
              },
            },
          },
        },
      },
    });
    if (!board) {
      return NextResponse.json({ error: "Board not found", code: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(board);
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
