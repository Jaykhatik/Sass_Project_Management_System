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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Good morning</h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening in {workspaceWithData.name} today.
          </p>
        </div>

        <NewProjectButton workspaceId={workspaceWithData.id} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border rounded-xl p-6 bg-card shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FolderKanbanIcon className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-3 text-muted-foreground mb-3 relative z-10">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
              <FolderKanbanIcon className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-sm">Active Projects</h3>
          </div>
          <p className="text-3xl font-bold relative z-10">
            {workspaceWithData.projects.length}
          </p>
        </div>

        <div className="border rounded-xl p-6 bg-card shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-3 text-muted-foreground mb-3 relative z-10">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-sm">Tasks Completed</h3>
          </div>
          <p className="text-3xl font-bold relative z-10">24</p>
        </div>

        <div className="border rounded-xl p-6 bg-card shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-3 text-muted-foreground mb-3 relative z-10">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-sm">Upcoming Deadlines</h3>
          </div>
          <p className="text-3xl font-bold relative z-10">
            {workspaceWithData.tasks.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
          <div className="p-6 border-b bg-muted/20 flex items-center justify-between">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              Recent Projects
            </h2>
            <button className="text-sm text-primary hover:underline">
              View all
            </button>
          </div>
          <div className="p-0">
            {workspaceWithData.projects.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No projects yet.
              </div>
            ) : (
              <div className="divide-y">
                {workspaceWithData.projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: project.color || "#6366F1" }}
                      >
                        {project.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.description || "No description"}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs font-medium px-2 py-1 bg-muted rounded-md text-muted-foreground capitalize">
                      {project.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
          <div className="p-6 border-b bg-muted/20 flex items-center justify-between">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
              My Upcoming Tasks
            </h2>
          </div>
          <div className="p-0">
            {workspaceWithData.tasks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No upcoming tasks. You&apos;re all caught up!
              </div>
            ) : (
              <div className="divide-y">
                {workspaceWithData.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 hover:bg-muted/30 transition-colors flex items-start gap-3 cursor-pointer"
                  >
                    <div className="mt-0.5 w-5 h-5 rounded border flex-shrink-0 border-muted-foreground/30 hover:border-primary hover:bg-primary/10 transition-colors"></div>
                    <div>
                      <p className="font-medium text-sm leading-tight">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString()
                            : "No due date"}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded uppercase tracking-wider text-[10px] font-bold ${
                            task.priority === "critical"
                              ? "bg-destructive/10 text-destructive"
                              : task.priority === "high"
                                ? "bg-orange-500/10 text-orange-600"
                                : task.priority === "medium"
                                  ? "bg-amber-500/10 text-amber-600"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {task.priority}
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
