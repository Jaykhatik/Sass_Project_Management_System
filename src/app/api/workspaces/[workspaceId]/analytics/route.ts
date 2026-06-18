import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUserWithRefresh } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const user = await getSessionUserWithRefresh();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const { workspaceId } = await params;

    // Verify access
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parallel queries for performance
    const [
      totalProjects,
      projectsByStatus,
      tasksByStatus,
      tasksByPriority,
      tasksByUserRaw,
      workspaceMembers,
    ] = await Promise.all([
      prisma.project.count({ where: { workspaceId } }),

      prisma.project.groupBy({
        by: ["status"],
        where: { workspaceId },
        _count: { id: true },
      }),

      prisma.task.groupBy({
        by: ["status"],
        where: { workspaceId, parentTaskId: null },
        _count: { id: true },
      }),

      prisma.task.groupBy({
        by: ["priority"],
        where: { workspaceId, parentTaskId: null },
        _count: { id: true },
      }),

      prisma.task.findMany({
        where: { workspaceId, parentTaskId: null },
        select: {
          status: true,
          assignees: {
            select: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),

      prisma.workspaceMember.findMany({
        where: { workspaceId },
        select: { userId: true, role: true }
      })
    ]);

    // Process tasksByUser to calculate workload per member
    const userWorkloadMap = new Map<
      string,
      { name: string; assigned: number; completed: number }
    >();

    for (const task of tasksByUserRaw) {
      for (const assignee of task.assignees) {
        const userId = assignee.user.id;
        const userName = assignee.user.name || assignee.user.email;

        if (!userWorkloadMap.has(userId)) {
          userWorkloadMap.set(userId, {
            name: userName,
            assigned: 0,
            completed: 0,
          });
        }

        const stats = userWorkloadMap.get(userId)!;
        stats.assigned += 1;

        if (task.status === "done" || task.status === "completed") {
          stats.completed += 1;
        }
      }
    }

    const tasksByUser = Array.from(userWorkloadMap.values())
      .map((data) => ({
        name: data.name,
        assigned: data.assigned,
        completed: data.completed,
      }))
      .sort((a, b) => b.assigned - a.assigned); // Sort by highest assigned first

    const totalTasks = tasksByStatus.reduce(
      (acc, curr) => acc + curr._count.id,
      0,
    );
    const completedTasksCount =
      tasksByStatus.find((s) => s.status === "done" || s.status === "completed")
        ?._count.id || 0;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

    const totalMembers = workspaceMembers.filter(m => m.role !== 'owner').length;

    return NextResponse.json({
      summary: {
        totalProjects,
        totalTasks,
        completedTasks: completedTasksCount,
        completionRate,
        totalMembers,
      },
      projectsByStatus: projectsByStatus.map((s) => ({
        name: s.status,
        value: s._count.id,
      })),
      tasksByStatus: tasksByStatus.map((s) => ({
        name: s.status,
        value: s._count.id,
      })),
      tasksByPriority: tasksByPriority.map((s) => ({
        name: s.priority,
        value: s._count.id,
      })),
      tasksByUser,
    });
  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
