import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUserWithRefresh } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ sprintId: string }> }) {
  try {
    const { sprintId } = await params;
    const user = await getSessionUserWithRefresh();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, status, name, goal, startDate, endDate, incompleteAction } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });

    if (!member || member.role !== "owner") {
      return NextResponse.json({ error: "Only the workspace owner can manage sprints" }, { status: 403 });
    }

    // Handle completeSprint incompleteAction logic
    if (status === "completed" && incompleteAction) {
      const sprint = await prisma.sprint.findUnique({ where: { id: sprintId }, include: { tasks: true } });
      if (sprint) {
        // Find tasks that are not done
        const incompleteTasks = sprint.tasks.filter(t => t.status !== "done" && t.status !== "completed");
        
        if (incompleteTasks.length > 0) {
          if (incompleteAction === "move_to_backlog") {
            await prisma.task.updateMany({
              where: { id: { in: incompleteTasks.map(t => t.id) } },
              data: { sprintId: null }
            });
          } else if (incompleteAction === "move_to_next_sprint") {
            // Find the next active or planned sprint
            const nextSprint = await prisma.sprint.findFirst({
              where: { 
                projectId: sprint.projectId, 
                id: { not: sprintId },
                status: { in: ["planned", "active"] }
              },
              orderBy: { createdAt: "asc" }
            });
            if (nextSprint) {
              await prisma.task.updateMany({
                where: { id: { in: incompleteTasks.map(t => t.id) } },
                data: { sprintId: nextSprint.id }
              });
            } else {
              // Fallback to backlog
              await prisma.task.updateMany({
                where: { id: { in: incompleteTasks.map(t => t.id) } },
                data: { sprintId: null }
              });
            }
          }
        }
      }
    }

    const updated = await prisma.sprint.update({
      where: { id: sprintId },
      data: {
        ...(status !== undefined && { status }),
        ...(name !== undefined && { name }),
        ...(goal !== undefined && { goal }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
      include: {
        tasks: {
          select: { id: true, status: true, storyPoints: true, updatedAt: true }
        }
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH sprint error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ sprintId: string }> }) {
  try {
    const { sprintId } = await params;
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

    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Detach tasks from this sprint before deleting
    await prisma.task.updateMany({
      where: { sprintId },
      data: { sprintId: null }
    });

    await prisma.sprint.delete({
      where: { id: sprintId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE sprint error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
