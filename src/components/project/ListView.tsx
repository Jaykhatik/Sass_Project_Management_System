"use client";

import React from "react";
import { AlertCircle, ArrowUp, Minus, ArrowDown, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

import { Column } from "@/types";

interface Props {
  columns: Column[];
}

const PRIORITY_ICON: Record<string, React.ReactNode> = {
  critical: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
  high: <ArrowUp className="w-3.5 h-3.5 text-orange-500" />,
  medium: <Minus className="w-3.5 h-3.5 text-yellow-500" />,
  low: <ArrowDown className="w-3.5 h-3.5 text-blue-400" />,
  none: <Minus className="w-3.5 h-3.5 text-muted-foreground" />,
};

const STATUS_STYLES: Record<string, string> = {
  todo: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  in_review: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
};

export function ListView({ columns }: Props) {
  const allTasks = columns.flatMap((col) =>
    col.tasks.map((task) => ({ ...task, columnName: col.name }))
  );

  if (allTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <User className="w-10 h-10 opacity-30" />
        <p className="text-sm">No tasks in this project yet.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
      {/* Table Header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-2.5 bg-muted/50 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <span>Task</span>
        <span className="w-24 text-center">Status</span>
        <span className="w-20 text-center">Priority</span>
        <span className="w-28 text-center">Assignee</span>
        <span className="w-24 text-center">Due Date</span>
      </div>

      {/* Rows */}
      <div className="divide-y">
        {allTasks.map((task) => {
          const overdue = task.dueDate && new Date(task.dueDate) < new Date();

          return (
            <div
              key={task.id}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              {/* Title + Labels */}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <div className="flex gap-1 mt-0.5 flex-wrap">
                  <span className="text-xs text-muted-foreground">{task.columnName}</span>
                  {task.labels?.map(({ label }) => (
                    <span
                      key={label.id}
                      className="text-xs px-1.5 rounded-full"
                      style={{
                        backgroundColor: `${label.color}20`,
                        color: label.color,
                      }}
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="w-24 text-center">
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                    STATUS_STYLES[task.status] ?? "bg-slate-100 text-slate-600"
                  )}
                >
                  {task.status.replace("_", " ")}
                </span>
              </div>

              {/* Priority */}
              <div className="w-20 flex justify-center items-center gap-1">
                {PRIORITY_ICON[task.priority] ?? PRIORITY_ICON.none}
                <span className="text-xs text-muted-foreground capitalize">
                  {task.priority}
                </span>
              </div>

              {/* Assignees */}
              <div className="w-28 flex justify-center">
                {!task.assignees || task.assignees.length === 0 ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  <div className="flex -space-x-1.5">
                    {task.assignees.slice(0, 3).map(({ user }) => (
                      <div
                        key={user.id}
                        title={user.name ?? "Unknown"}
                        className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-card flex items-center justify-center text-white text-[9px] font-bold"
                      >
                        {(user.name ?? "U").charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div className="w-24 text-center">
                {task.dueDate ? (
                  <span
                    className={cn(
                      "flex items-center justify-center gap-1 text-xs",
                      overdue ? "text-destructive font-semibold" : "text-muted-foreground"
                    )}
                  >
                    <Clock className="w-3 h-3" />
                    {new Date(task.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
