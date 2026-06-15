import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; userId: string }> },
) {
  try {
    const { workspaceId, userId } = await params;
    const body = await request.json();

    // Manual Validation (Replaces Zod)
    const validRoles = ["admin", "member", "guest"];
    if (!body.role || typeof body.role !== "string" || !validRoles.includes(body.role)) {
      return NextResponse.json(
        { error: "Invalid role provided", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    // In Phase 14, we will add auth verification here
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) {
      return NextResponse.json({ error: "Member not found in this workspace", code: "NOT_FOUND" }, { status: 404 });
    }
    if (member.role === "owner") {
      return NextResponse.json({ error: "Cannot change the role of the workspace owner", code: "FORBIDDEN" }, { status: 403 });
    }
    const updatedMember = await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role: body.role },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return NextResponse.json(updatedMember);
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; userId: string }> },
) {
  try {
    const { workspaceId, userId } = await params;

    // In Phase 14, we will add auth verification here
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) {
      return NextResponse.json({ error: "Member not found in this workspace", code: "NOT_FOUND" }, { status: 404 });
    }
    if (member.role === "owner") {
      return NextResponse.json({ error: "Cannot remove the workspace owner", code: "FORBIDDEN" }, { status: 403 });
    }
    await prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
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
