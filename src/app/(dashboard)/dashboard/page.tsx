import React from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { FolderKanban as FolderKanbanIcon } from "lucide-react";
import { NewProjectButton } from "@/components/project/NewProjectButton";
import { getSessionUser, getPrimaryWorkspaceForUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) notFound();

  const workspace = await getPrimaryWorkspaceForUser(user.id);
  if (!workspace) notFound();

  const workspaceWithData = await prisma.workspace.findUnique({
    where: { id: workspace.id },
    include: {
      projects: true,
      tasks: {
        where: { status: { not: "done" } },
        orderBy: { dueDate: "asc" },
        take: 5,
      },
    },
  });

  if (!workspaceWithData) notFound();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          Good morning, {user.name?.split(" ")[0] || "User"}
        </h1>
        <p className="text-muted-foreground text-lg font-medium">
          Here&apos;s what&apos;s happening in <span className="text-primary">{workspaceWithData.name}</span> today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-border/50 rounded-3xl p-6 bg-card/40 backdrop-blur-xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <FolderKanbanIcon className="w-40 h-40" />
          </div>
          <div className="flex items-center gap-3 text-muted-foreground mb-4 relative z-10">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500 shadow-sm border border-indigo-500/20">
              <FolderKanbanIcon className="w-5 h-5" />
            </div>
            <h3 className="font-bold tracking-wide uppercase text-xs">Active Projects</h3>
          </div>
          <p className="text-4xl font-black relative z-10 text-foreground/90">
            {workspaceWithData.projects.length}
          </p>
        </div>

        <div className="border border-border/50 rounded-3xl p-6 bg-card/40 backdrop-blur-xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <CheckCircle2 className="w-40 h-40" />
          </div>
          <div className="flex items-center gap-3 text-muted-foreground mb-4 relative z-10">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500 shadow-sm border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold tracking-wide uppercase text-xs">Tasks Completed</h3>
          </div>
          <p className="text-4xl font-black relative z-10 text-foreground/90">24</p>
        </div>

        <div className="border border-border/50 rounded-3xl p-6 bg-card/40 backdrop-blur-xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <Clock className="w-40 h-40" />
          </div>
          <div className="flex items-center gap-3 text-muted-foreground mb-4 relative z-10">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 shadow-sm border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold tracking-wide uppercase text-xs">Upcoming Deadlines</h3>
          </div>
          <p className="text-4xl font-black relative z-10 text-foreground/90">
            {workspaceWithData.tasks.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-border/50 rounded-3xl overflow-hidden bg-card/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col max-h-[500px]">
          <div className="p-5 sm:p-6 border-b border-border/50 bg-muted/30 flex items-center justify-between shrink-0">
            <h2 className="font-bold text-lg flex items-center gap-2.5">
              <div className="p-1.5 bg-background rounded-md shadow-sm border border-border/50">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              Recent Projects
            </h2>
            <NewProjectButton workspaceId={workspaceWithData.id} />
          </div>
          <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
            {workspaceWithData.projects.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-muted-foreground text-sm h-full">
                <FolderKanbanIcon className="w-12 h-12 opacity-20 mb-3" />
                <p className="font-medium">No projects yet. Create one!</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {workspaceWithData.projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-5 hover:bg-muted/40 transition-colors flex items-center justify-between cursor-pointer group"
                  >
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
                    <div className="text-[10px] font-bold px-2.5 py-1 uppercase tracking-widest bg-background border border-border/50 rounded-lg text-muted-foreground shadow-sm">
                      {project.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border border-border/50 rounded-3xl overflow-hidden bg-card/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col max-h-[500px]">
          <div className="p-5 sm:p-6 border-b border-border/50 bg-muted/30 flex items-center justify-between shrink-0">
            <h2 className="font-bold text-lg flex items-center gap-2.5">
              <div className="p-1.5 bg-background rounded-md shadow-sm border border-border/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              My Upcoming Tasks
            </h2>
          </div>
          <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
            {workspaceWithData.tasks.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-muted-foreground text-sm h-full">
                <CheckCircle2 className="w-12 h-12 opacity-20 mb-3" />
                <p className="font-medium">No upcoming tasks. You&apos;re all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {workspaceWithData.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-5 hover:bg-muted/40 transition-colors flex items-start gap-4 cursor-pointer group"
                  >
                    <div className="mt-1 w-5 h-5 rounded-md border-2 flex-shrink-0 border-border/80 group-hover:border-primary group-hover:bg-primary/10 transition-colors shadow-sm bg-background/50"></div>
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
