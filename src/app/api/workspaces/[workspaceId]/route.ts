import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    const body = await request.json();

    // Manual Validation (Replaces Zod)
    if (
      body.name !== undefined &&
      (typeof body.name !== "string" ||
        body.name.trim().length < 2 ||
        body.name.trim().length > 50)
    ) {
      return NextResponse.json(
        {
          error: "Workspace name must be between 2 and 50 characters",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    if (body.logoUrl !== undefined && typeof body.logoUrl !== "string") {
      return NextResponse.json(
        { error: "Invalid logo URL", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    // In Phase 14, we will add auth verification here
    const existing = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!existing) {
      return NextResponse.json({ error: "Workspace not found", code: "NOT_FOUND" }, { status: 404 });
    }
    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { ...(body.name !== undefined && { name: body.name }), ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }) },
    });

    return NextResponse.json(updatedWorkspace);
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
