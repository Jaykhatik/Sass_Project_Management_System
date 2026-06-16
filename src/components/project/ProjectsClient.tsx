"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LayoutGrid, AlignLeft, Clock } from "lucide-react";
import { NewProjectDialog } from "@/components/project/NewProjectDialog";

interface Board {
  id: string;
  _count: { tasks: number };
}

interface Project {
  project_id: string;
  workspaceId: string;
  projectInfo: {
    name: string;
    description: string | null;
    status: string;
    color: string | null;
    icon: string | null;
    startDate: string | null;
    dueDate: string | null;
    createdAt: string;
    updatedAt: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  defaultBoardId: string | null;
  taskCount: number;
}

interface Props {
  projects: Project[];
  workspaceId: string;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  archived: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  completed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

export function ProjectsClient({ projects, workspaceId }: Props) {
  const [showDialog, setShowDialog] = useState(false);
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {projects.length} project{projects.length !== 1 ? "s" : ""} in this
            workspace
          </p>
        </div>
        <button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="border-2 border-dashed rounded-xl p-16 flex flex-col items-center justify-center text-center gap-4 text-muted-foreground">
          <div className="p-4 bg-muted rounded-full">
            <LayoutGrid className="w-8 h-8" />
          </div>
          <div>
            <p className="font-medium text-foreground">No projects yet</p>
            <p className="text-sm mt-1">
              Create your first project to get started.
            </p>
          </div>
          <button
            onClick={() => setShowDialog(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div
              key={project.project_id}
              onClick={() =>
                router.push(`/dashboard/projects/${project.project_id}`)
              }
              className="group border rounded-xl bg-card shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden hover:-translate-y-0.5"
            >
              {/* Color bar */}
              <div
                className="h-1.5 w-full"
                style={{
                  backgroundColor: project.projectInfo.color ?? "#6366F1",
                }}
              />

              <div className="p-5 space-y-4">
                {/* Title row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{
                        backgroundColor: project.projectInfo.color ?? "#6366F1",
                      }}
                    >
                      {project.projectInfo.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                        {project.projectInfo.name}
                      </h3>
                      {project.projectInfo.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {project.projectInfo.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border capitalize shrink-0 ${STATUS_STYLES[project.projectInfo.status] ?? STATUS_STYLES.active}`}
                  >
                    {project.projectInfo.status}
                  </span>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t">
                  <div className="flex items-center gap-1.5">
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>
                      {project.taskCount} task
                      {project.taskCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {project.projectInfo.dueDate && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Due{" "}
                        {new Date(
                          project.projectInfo.dueDate,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDialog && (
        <NewProjectDialog
          workspaceId={workspaceId}
          onClose={() => setShowDialog(false)}
        />
      )}
    </div>
  );
}
