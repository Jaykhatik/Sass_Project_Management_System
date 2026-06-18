import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUserWithRefresh } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const user = await getSessionUserWithRefresh();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const memberId = searchParams.get("memberId");

    // Start with a base where clause
    const whereClause: any = {
      workspaceId,
    };

    if (memberId) {
      whereClause.actorId = memberId;
    }

    const logs = await prisma.activityLog.findMany({
      where: whereClause,
      include: {
        actor: {
          select: { id: true, name: true, avatarUrl: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100 // limit to last 100 activities
    });

    // We fetch tasks explicitly if projectId is provided
    let filteredLogs = logs;
    
    if (projectId) {
      const projectTasks = await prisma.task.findMany({
        where: { projectId },
        select: { id: true }
      });
      const taskIds = new Set(projectTasks.map(t => t.id));

      filteredLogs = logs.filter(log => {
        if (log.entityType === "project" && log.entityId === projectId) return true;
        if (log.entityType === "task" && taskIds.has(log.entityId)) return true;
        return false;
      });
    }

    // Enrich with entity titles
    const taskIdsInLogs = [...new Set(filteredLogs.filter(l => l.entityType === "task").map(l => l.entityId))];
    const projectIdsInLogs = [...new Set(filteredLogs.filter(l => l.entityType === "project").map(l => l.entityId))];

    const [tasks, projects] = await Promise.all([
      prisma.task.findMany({ where: { id: { in: taskIdsInLogs } }, select: { id: true, title: true } }),
      prisma.project.findMany({ where: { id: { in: projectIdsInLogs } }, select: { id: true, name: true } })
    ]);

    const taskMap = new Map(tasks.map(t => [t.id, t.title]));
    const projectMap = new Map(projects.map(p => [p.id, p.name]));

    const enrichedLogs = filteredLogs.map(log => {
      let entityTitle = null;
      if (log.entityType === "task") entityTitle = taskMap.get(log.entityId) || "Deleted Task";
      if (log.entityType === "project") entityTitle = projectMap.get(log.entityId) || "Deleted Project";
      
      return { ...log, entityTitle };
    });

    return NextResponse.json(enrichedLogs);
  } catch (error: any) {
    console.error("GET workspace activity error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
