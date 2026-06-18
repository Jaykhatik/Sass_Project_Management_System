import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUserWithRefresh } from "@/lib/auth";
import { logActivity } from "@/lib/activityLogger";

export async function GET(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await params;
    const user = await getSessionUserWithRefresh();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const comments = await prisma.comment.findMany({
      where: { taskId, workspaceId },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true, email: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(comments);
  } catch (error: any) {
    console.error("GET comments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await params;
    const user = await getSessionUserWithRefresh();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, content, parentId } = body;

    if (!workspaceId || !content) {
      return NextResponse.json({ error: "workspaceId and content are required" }, { status: 400 });
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const comment = await prisma.comment.create({
      data: {
        taskId,
        workspaceId,
        authorId: user.id,
        content,
        ...(parentId && { parentId })
      },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true, email: true }
        }
      }
    });

    await logActivity(
      workspaceId,
      user.id,
      "task",
      taskId,
      "commented",
      null,
      { commentId: comment.id, content: content.substring(0, 50) }
    );

    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    console.error("POST comment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
