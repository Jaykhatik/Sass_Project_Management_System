import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUserWithRefresh } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const user = await getSessionUserWithRefresh();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    // Auth check
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sprints = await prisma.sprint.findMany({
      where: { projectId, workspaceId },
      include: {
        tasks: {
          include: {
            assignees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
            labels: { include: { label: true } },
            subTasks: { select: { id: true, title: true, status: true }, orderBy: { createdAt: "asc" } },
            blockedBy: { select: { blockerTaskId: true } },
          },
          orderBy: { position: "asc" }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(sprints);
  } catch (error: any) {
    console.error("GET sprints error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const user = await getSessionUserWithRefresh();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, name, goal, startDate, endDate } = body;

    if (!workspaceId || !name) {
      return NextResponse.json({ error: "workspaceId and name are required" }, { status: 400 });
    }

    // Auth check
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });

    if (!member || member.role !== "owner") {
      return NextResponse.json({ error: "Only the workspace owner can create sprints" }, { status: 403 });
    }

    const sprint = await prisma.sprint.create({
      data: {
        projectId,
        workspaceId,
        name,
        goal,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        tasks: {
          select: { id: true, status: true, storyPoints: true, updatedAt: true }
        }
      }
    });

    return NextResponse.json(sprint, { status: 201 });
  } catch (error: any) {
    console.error("POST sprint error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
