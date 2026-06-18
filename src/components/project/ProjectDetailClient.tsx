"use client";

import React, { useState } from "react";
import { Kanban, AlignLeft, Settings } from "lucide-react";
import { BoardView } from "@/components/project/BoardView";
import { ListView } from "@/components/project/ListView";
import { BacklogView } from "@/components/project/BacklogView";
import { ProjectSettings } from "@/components/project/ProjectSettings";
import { cn } from "@/lib/utils";

import { Project } from "@/types";

const TABS = [
  { key: "board", label: "Board", icon: Kanban },
  { key: "list", label: "List", icon: AlignLeft },
  { key: "backlog", label: "Backlog", icon: AlignLeft },
  { key: "settings", label: "Settings", icon: Settings },
] as const;

type Tab = (typeof TABS)[number]["key"];

export function ProjectDetailClient({ project, isOwner }: { project: Project, isOwner: boolean }) {
  const [activeTab, setActiveTab] = useState<Tab>("board");
  const defaultBoard = project.boards?.[0];

  return (
    <div className="space-y-5">
      {/* Project Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left px-4 sm:px-0">
        <div
          className="w-12 h-12 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl sm:text-lg shrink-0 mx-auto sm:mx-0 shadow-sm"
          style={{ backgroundColor: project.projectInfo.color ?? "#6366F1" }}
        >
          {project.projectInfo.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {project.projectInfo.name}
          </h1>
          {project.projectInfo.description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {project.projectInfo.description}
            </p>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center w-full border-b overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] px-1 sm:px-0">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex flex-1 sm:flex-none items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted",
            )}
          >
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
            projectId={project.project_id}
            boardId={defaultBoard.id}
          />
        )}
        {activeTab === "board" && !defaultBoard && (
          <p className="text-sm text-muted-foreground py-10 text-center">
            No board found for this project.
          </p>
        )}
        {activeTab === "list" && defaultBoard && (
          <ListView columns={defaultBoard.columns} workspaceId={project.workspaceId} />
        )}
        {activeTab === "backlog" && (
          <BacklogView 
            workspaceId={project.workspaceId} 
            projectId={project.project_id} 
            project={project}
          />
        )}
        {activeTab === "settings" && <ProjectSettings project={project} isOwner={isOwner} />}
      </div>
    </div>
  );
}
