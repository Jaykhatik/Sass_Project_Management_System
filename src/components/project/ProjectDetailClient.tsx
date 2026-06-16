"use client";

import React, { useState } from "react";
import { Kanban, AlignLeft, Settings } from "lucide-react";
import { BoardView } from "@/components/project/BoardView";
import { ListView } from "@/components/project/ListView";
import { ProjectSettings } from "@/components/project/ProjectSettings";
import { cn } from "@/lib/utils";

interface Assignee {
  user: { id: string; name: string | null; avatarUrl: string | null };
}
interface Label {
  label: { id: string; name: string; color: string };
}
interface Task {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueDate: string | null;
  assignees: Assignee[];
  labels: Label[];
}
interface Column {
  id: string;
  name: string;
  color: string | null;
  isDoneCol: boolean | null;
  taskLimit: number | null;
  tasks: Task[];
}
interface Board {
  id: string;
  columns: Column[];
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
  boards: Board[];
  taskCount: number;
}

const TABS = [
  { key: "board", label: "Board", icon: Kanban },
  { key: "list", label: "List", icon: AlignLeft },
  { key: "settings", label: "Settings", icon: Settings },
] as const;

type Tab = typeof TABS[number]["key"];

export function ProjectDetailClient({ project }: { project: Project }) {
  const [activeTab, setActiveTab] = useState<Tab>("board");
  const defaultBoard = project.boards[0];

  return (
    <div className="space-y-5">
      {/* Project Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
          style={{ backgroundColor: project.projectInfo.color ?? "#6366F1" }}
        >
          {project.projectInfo.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{project.projectInfo.name}</h1>
          {project.projectInfo.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{project.projectInfo.description}</p>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 border-b">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "board" && defaultBoard && (
          <BoardView
            columns={defaultBoard.columns}
            workspaceId={project.workspaceId}
          />
        )}
        {activeTab === "board" && !defaultBoard && (
          <p className="text-sm text-muted-foreground py-10 text-center">
            No board found for this project.
          </p>
        )}
        {activeTab === "list" && defaultBoard && (
          <ListView columns={defaultBoard.columns} />
        )}
        {activeTab === "settings" && (
          <ProjectSettings project={project} />
        )}
      </div>
    </div>
  );
}
