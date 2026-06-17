"use client";

import React from "react";
import { Task } from "@/types";
import { Calendar, AlertCircle, CheckSquare, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  task: Task;
  onClick: () => void;
}

const PriorityIcon = ({ priority }: { priority: string }) => {
  switch (priority) {
    case "critical":
      return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
    case "high":
      return <AlertCircle className="w-3.5 h-3.5 text-orange-500" />;
    case "medium":
      return <AlertCircle className="w-3.5 h-3.5 text-blue-500" />;
    case "low":
      return <AlertCircle className="w-3.5 h-3.5 text-slate-400" />;
    default:
      return null;
  }
};

export function TaskCard({ task, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      draggable // Native HTML5 drag support
      onDragStart={(e) => {
        e.dataTransfer.setData("taskId", task.id);
        e.dataTransfer.setData("sourceColumnId", task.columnId || ""); // Wait, task might not have columnId in UI yet. Wait, we should make sure Task interface has columnId!
        // We will handle DnD logic in the parent container
      }}
      className="group bg-card border border-border hover:border-primary/40 rounded-xl p-3 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all hover:-translate-y-0.5"
    >
      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((tl) => (
            <span
              key={tl.label.id}
              className="text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-sm"
              style={{ backgroundColor: tl.label.color }}
            >
              {tl.label.name}
            </span>
          ))}
        </div>
      )}

      {/* Title & Blocked Status */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-medium text-foreground leading-snug">
          {task.title}
        </p>
        {task.blockedBy && task.blockedBy.length > 0 && (
          <span title="Blocked by another task" className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shadow-sm bg-red-600 flex items-center gap-1 shrink-0">
            <ShieldAlert className="w-3 h-3" /> Blocked
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
        <div className="flex items-center gap-2">
          {task.priority !== "none" && <PriorityIcon priority={task.priority} />}
          {task.dueDate && (
            <div className={cn("flex items-center gap-1", new Date(task.dueDate) < new Date() && "text-red-500 font-medium")}>
              <Calendar className="w-3 h-3" />
              <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
            </div>
          )}
          {task.subTasks && task.subTasks.length > 0 && (() => {
            const completedCount = task.subTasks.filter((st:any) => st.status === 'done').length;
            const totalCount = task.subTasks.length;
            const allDone = completedCount === totalCount;
            return (
              <div 
                className={cn(
                  "flex items-center gap-1 ml-1 transition-colors",
                  allDone ? "text-emerald-500 font-medium" : "text-muted-foreground"
                )} 
                title={`${completedCount} of ${totalCount} sub-tasks completed`}
              >
                <CheckSquare className="w-3 h-3" />
                <span>
                  {completedCount}/{totalCount}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Assignees */}
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex items-center -space-x-1.5">
            {task.assignees.slice(0, 3).map((ta) => (
              <div
                key={ta.user.id}
                className="w-5 h-5 rounded-full border border-background bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[9px] text-white font-bold"
                title={ta.user.name || ta.user.email}
              >
                {ta.user.avatarUrl ? (
                  <img src={ta.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  (ta.user.name || "U").charAt(0).toUpperCase()
                )}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div className="w-5 h-5 rounded-full border border-background bg-muted flex items-center justify-center text-[9px] font-bold">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
