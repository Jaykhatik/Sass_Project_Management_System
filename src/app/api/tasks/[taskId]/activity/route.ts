import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUserWithRefresh } from "@/lib/auth";

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

    const logs = await prisma.activityLog.findMany({
      where: { 
        workspaceId,
        entityType: "task",
        entityId: taskId
      },
      include: {
        actor: {
          select: { id: true, name: true, avatarUrl: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("GET activity error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
