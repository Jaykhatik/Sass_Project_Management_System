import React from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, CheckCircle2, TrendingUp, FolderKanban as FolderKanbanIcon, AlertCircle } from "lucide-react";
import { NewProjectButton } from "@/components/project/NewProjectButton";
import { getSessionUser, getPrimaryWorkspaceForUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) notFound();

  const workspace = await getPrimaryWorkspaceForUser(user.id);
  if (!workspace) notFound();

  // 1. Fetch Workspace with 6 recent projects (including task counts)
  const workspaceWithData = await prisma.workspace.findUnique({
    where: { id: workspace.id },
    include: {
      projects: {
        orderBy: { updatedAt: "desc" },
        take: 6,
        include: {
          _count: {
            select: { tasks: { where: { parentTaskId: null } } }
          },
          tasks: {
            where: { status: "done", parentTaskId: null },
            select: { id: true }
          }
        }
      },
    },
  });

  if (!workspaceWithData) notFound();

  // 2. Fetch "My" upcoming tasks
  let upcomingTasks = await prisma.task.findMany({
    where: {
      workspaceId: workspace.id,
      status: { not: "done" },
      parentTaskId: null,
      assignees: { some: { userId: user.id } }
    },
    orderBy: { dueDate: "asc" },
    take: 5,
  });

  // If user has no tasks assigned, fallback to showing workspace activity
  if (upcomingTasks.length === 0) {
    upcomingTasks = await prisma.task.findMany({
      where: {
        workspaceId: workspace.id,
        status: { not: "done" },
        parentTaskId: null,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  }

  // 3. True Metrics
  const completedTasksCount = await prisma.task.count({
    where: { workspaceId: workspace.id, status: "done", parentTaskId: null }
  });

  const activeProjectsCount = await prisma.project.count({
    where: { workspaceId: workspace.id, status: "active" }
  });

  const upcomingDeadlinesCount = await prisma.task.count({
    where: { 
      workspaceId: workspace.id, 
      status: { not: "done" },
      parentTaskId: null,
      dueDate: { not: null }
    }
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto pb-12 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-0">
      <div className="flex flex-col gap-1.5 sm:gap-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          Good morning, {user.name?.split(" ")[0] || "User"}
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg font-medium">
          Here&apos;s what&apos;s happening in <span className="text-primary">{workspaceWithData.name}</span> today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="border border-border/50 rounded-3xl p-5 sm:p-6 bg-card/40 backdrop-blur-xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <FolderKanbanIcon className="w-40 h-40 text-indigo-500" />
          </div>
          <div className="flex items-center gap-3 text-muted-foreground mb-4 relative z-10">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500 shadow-sm border border-indigo-500/20">
              <FolderKanbanIcon className="w-5 h-5" />
            </div>
            <h3 className="font-bold tracking-wide uppercase text-xs">Active Projects</h3>
          </div>
          <p className="text-4xl font-black relative z-10 text-foreground/90">
            {activeProjectsCount}
          </p>
        </div>

        <div className="border border-border/50 rounded-3xl p-5 sm:p-6 bg-card/40 backdrop-blur-xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <CheckCircle2 className="w-40 h-40 text-emerald-500" />
          </div>
          <div className="flex items-center gap-3 text-muted-foreground mb-4 relative z-10">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500 shadow-sm border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold tracking-wide uppercase text-xs">Tasks Completed</h3>
          </div>
          <p className="text-4xl font-black relative z-10 text-foreground/90">
            {completedTasksCount}
          </p>
        </div>

        <div className="border border-border/50 rounded-3xl p-5 sm:p-6 bg-card/40 backdrop-blur-xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <Clock className="w-40 h-40 text-amber-500" />
          </div>
          <div className="flex items-center gap-3 text-muted-foreground mb-4 relative z-10">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 shadow-sm border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold tracking-wide uppercase text-xs">Upcoming Deadlines</h3>
          </div>
          <p className="text-4xl font-black relative z-10 text-foreground/90">
            {upcomingDeadlinesCount}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="border border-border/50 rounded-3xl overflow-hidden bg-card/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col max-h-[500px] sm:max-h-[600px]">
          <div className="p-3 sm:p-6 border-b border-border/50 bg-muted/30 flex items-center justify-between shrink-0 gap-4">
            <h2 className="font-bold text-base sm:text-lg flex items-center gap-2 sm:gap-2.5 whitespace-nowrap">
              <div className="p-1 sm:p-1.5 bg-background rounded-md shadow-sm border border-border/50 shrink-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              </div>
              <span className="truncate">Recent Projects</span>
            </h2>
            <div className="shrink-0">
              <NewProjectButton workspaceId={workspaceWithData.id} />
            </div>
          </div>
          <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
            {workspaceWithData.projects.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-muted-foreground text-sm h-full">
                <FolderKanbanIcon className="w-12 h-12 opacity-20 mb-3" />
                <p className="font-medium">No projects yet. Create one!</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {workspaceWithData.projects.map((project) => {
                  const totalTasks = project._count.tasks;
                  const completedTasks = project.tasks.length;
                  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

                  return (
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      key={project.id}
                      className="p-5 hover:bg-muted/40 transition-colors flex flex-col gap-3 cursor-pointer group block"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm transform group-hover:scale-105 transition-transform"
                            style={{ backgroundColor: project.color || "#6366F1" }}
                          >
                            {project.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-base group-hover:text-primary transition-colors">{project.name}</p>
                            <p className="text-xs font-medium text-muted-foreground mt-0.5 line-clamp-1">
                              {project.description || "No description provided"}
                            </p>
                          </div>
                        </div>
                        <div className={`text-[10px] font-bold px-2.5 py-1 uppercase tracking-widest bg-background border border-border/50 rounded-lg shadow-sm ${project.status === 'archived' ? 'text-slate-400' : 'text-muted-foreground'}`}>
                          {project.status}
                        </div>
                      </div>
                      
                      {/* Interactive Progress Bar */}
                      {totalTasks > 0 && (
                        <div className="w-full flex items-center gap-3">
                          <div className="h-1.5 w-full bg-border/40 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-1000 ease-out"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground w-8 text-right shrink-0">
                            {progress}%
                          </span>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="border border-border/50 rounded-3xl overflow-hidden bg-card/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col max-h-[500px] sm:max-h-[600px]">
          <div className="p-4 sm:p-6 border-b border-border/50 bg-muted/30 flex items-center justify-between shrink-0 gap-2">
            <h2 className="font-bold text-base sm:text-lg flex items-center gap-2 sm:gap-2.5 whitespace-nowrap">
              <div className="p-1 sm:p-1.5 bg-background rounded-md shadow-sm border border-border/50 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
              </div>
              <span className="truncate">My Upcoming Tasks</span>
            </h2>
          </div>
          <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
            {upcomingTasks.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-muted-foreground text-sm h-full">
                <CheckCircle2 className="w-12 h-12 opacity-20 mb-3" />
                <p className="font-medium">No upcoming tasks. You&apos;re all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {upcomingTasks.map((task) => (
                  <Link
                    href={`/dashboard/projects/${task.projectId}`}
                    key={task.id}
                    className="p-5 hover:bg-muted/40 transition-colors flex items-start gap-4 cursor-pointer group block"
                  >
                    <div className="mt-1 w-5 h-5 rounded-md border-2 flex-shrink-0 border-border/80 group-hover:border-primary group-hover:bg-primary/10 transition-colors shadow-sm bg-background/50 flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 opacity-70" />
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                            : "No due date"}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-border/80" />
                        <span
                          className={`px-2 py-0.5 rounded-md uppercase tracking-widest text-[10px] font-bold shadow-sm ${
                            task.priority === "critical"
                              ? "bg-red-500/10 text-red-600 border border-red-500/20"
                              : task.priority === "high"
                                ? "bg-orange-500/10 text-orange-600 border border-orange-500/20"
                                : task.priority === "medium"
                                  ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                  : "bg-background border border-border/50 text-muted-foreground"
                          }`}
                        >
                          {task.priority || "Normal"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
