import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUserWithRefresh } from "@/lib/auth";
import { logActivity } from "@/lib/activityLogger";

export async function PATCH(request: Request, { params }: { params: Promise<{ taskId: string, commentId: string }> }) {
  try {
    const { commentId, taskId } = await params;
    const user = await getSessionUserWithRefresh();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, content } = body;

    if (!workspaceId || !content) {
      return NextResponse.json({ error: "workspaceId and content are required" }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } }
    });

    if (comment.authorId !== user.id && (!member || member.role !== "owner")) {
      return NextResponse.json({ error: "Only the author or workspace owner can edit this comment" }, { status: 403 });
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        isEdited: true
      },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true, email: true }
        }
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH comment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ taskId: string, commentId: string }> }) {
  try {
    const { commentId, taskId } = await params;
    const user = await getSessionUserWithRefresh();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } }
    });

    // Verify ownership or workspace owner
    if (comment.authorId !== user.id && (!member || member.role !== "owner")) {
      return NextResponse.json({ error: "Only the author or workspace owner can delete this comment" }, { status: 403 });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    await logActivity(
      workspaceId,
      user.id,
      "task",
      taskId,
      "deleted a comment",
      { commentId: comment.id, content: comment.content.substring(0, 50) },
      null
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE comment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
