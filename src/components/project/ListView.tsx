"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowUp, Minus, ArrowDown, Clock, User, CheckSquare, ShieldAlert } from "lucide-react";
import { TaskModal } from "@/components/task/TaskModal";
import { cn } from "@/lib/utils";

import { Column } from "@/types";

interface Props {
  columns: Column[];
  workspaceId: string;
}

const PRIORITY_ICON: Record<string, React.ReactNode> = {
  critical: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
  high: <ArrowUp className="w-3.5 h-3.5 text-orange-500" />,
  medium: <Minus className="w-3.5 h-3.5 text-yellow-500" />,
  low: <ArrowDown className="w-3.5 h-3.5 text-blue-400" />,
  none: <Minus className="w-3.5 h-3.5 text-muted-foreground" />,
};

const STATUS_STYLES: Record<string, string> = {
  todo: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  in_review: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  done: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

export function ListView({ columns, workspaceId }: Props) {
  const router = useRouter();
  const [activeTask, setActiveTask] = useState<string | null>(null);
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
    <>
      <div className="border border-border/50 rounded-3xl overflow-hidden bg-card/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-track]:bg-transparent">
        <div className="min-w-full sm:min-w-[900px]">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-[1fr_120px_100px_140px_120px_120px] gap-4 px-6 py-3.5 bg-muted/40 border-b border-border/50 text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">
            <span>Task</span>
            <span className="text-center">Status</span>
            <span className="text-center">Priority</span>
            <span className="text-center">Metrics</span>
            <span className="text-center">Assignee</span>
            <span className="text-center">Due Date</span>
          </div>

      {/* Rows */}
      <div className="divide-y divide-border/40">
        {allTasks.map((task) => {
          const overdue = task.dueDate && new Date(task.dueDate) < new Date();

          return (
            <div
              key={task.id}
              onClick={() => setActiveTask(task.id)}
              className="flex flex-col sm:grid sm:grid-cols-[1fr_120px_100px_140px_120px_120px] gap-3 sm:gap-4 items-start sm:items-center px-4 sm:px-6 py-4 hover:bg-muted/40 transition-all duration-300 cursor-pointer group relative overflow-hidden before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary before:-translate-x-full group-hover:before:translate-x-0 before:transition-transform before:duration-300 before:ease-out before:rounded-r-full"
            >
              {/* Title + Labels */}
              <div className="min-w-0 pr-0 sm:pr-4 w-full sm:w-auto">
                <div className="flex items-center gap-2.5">
                  <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{task.title}</p>
                  {task.blockedBy && task.blockedBy.length > 0 && (
                    <span title="Blocked by another task" className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white shadow-sm bg-red-600 flex items-center gap-1 shrink-0 uppercase tracking-widest">
                      <ShieldAlert className="w-3 h-3" /> Blocked
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5 mt-1.5 flex-wrap items-center">
                  {task.labels?.map(({ label }) => (
                    <span
                      key={label.id}
                      className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border"
                      style={{
                        backgroundColor: `${label.color}20`,
                        color: label.color,
                      }}
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
                
                {/* Render Sub-tasks Summary */}
                {task.subTasks && task.subTasks.length > 0 && (() => {
                  const completedCount = task.subTasks.filter((st:any) => st.status === 'done').length;
                  const totalCount = task.subTasks.length;
                  const allDone = completedCount === totalCount;
                  
                  return (
                    <div className="mt-2.5">
                      <span 
                        title={`${completedCount} of ${totalCount} sub-tasks completed`}
                        className={cn(
                          "inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded border shadow-sm transition-colors",
                          allDone 
                            ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" 
                            : "text-muted-foreground bg-muted/60 border-border/50"
                        )}
                      >
                        <CheckSquare className={cn("w-3 h-3", allDone ? "opacity-100" : "opacity-70")} />
                        {completedCount}/{totalCount}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Mobile Wrapper 1: Status & Priority */}
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:contents mt-2 sm:mt-0">
                {/* Status */}
                <div className="flex justify-start sm:justify-center">
                  <span
                    className={cn(
                      "text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-lg border shadow-sm",
                      STATUS_STYLES[task.status] ?? "bg-slate-500/10 text-slate-600 border-slate-500/20"
                    )}
                  >
                    {task.status.replace("_", " ")}
                  </span>
                </div>

                {/* Priority */}
                <div className="flex justify-start sm:justify-center items-center gap-1.5">
                  {PRIORITY_ICON[task.priority] ?? PRIORITY_ICON.none}
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {task.priority}
                  </span>
                </div>
              </div>

              {/* Mobile Wrapper 2: Metrics & Assignees */}
              <div className="flex items-center justify-between sm:justify-center gap-4 w-full sm:w-auto sm:contents mt-3 sm:mt-0">

              {/* Metrics (Story Points & Hours) */}
              <div className="flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-2 sm:gap-1.5">
                {task.storyPoints != null && (
                  <span title="Story Points" className="text-[10px] font-bold flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-lg border border-border/50 text-muted-foreground w-auto sm:w-[80%] justify-center shadow-sm">
                    ⭐ {task.storyPoints}
                  </span>
                )}
                {(task.estimatedHours != null || task.actualHours != null) && (
                  <span title="Hours (Actual / Estimated)" className="text-[10px] font-bold flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-lg border border-border/50 text-muted-foreground w-auto sm:w-[80%] justify-center shadow-sm">
                    ⏱️ {task.actualHours || 0} / {task.estimatedHours || 0}h
                  </span>
                )}
                {task.storyPoints == null && task.estimatedHours == null && task.actualHours == null && (
                  <span className="text-xs font-bold text-muted-foreground opacity-50 hidden sm:inline-block">—</span>
                )}
              </div>

              {/* Assignees */}
              <div className="flex justify-end sm:justify-center">
                {!task.assignees || task.assignees.length === 0 ? (
                  <span className="text-xs font-bold text-muted-foreground opacity-50 hidden sm:inline-block">—</span>
                ) : (
                  <div className="flex -space-x-2">
                    {task.assignees.slice(0, 3).map(({ user }) => (
                      <div
                        key={user.id}
                        title={user.name ?? "Unknown"}
                        className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-background flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                      >
                        {(user.name ?? "U").charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </div>

              {/* Mobile Wrapper 3: Due Date */}
              <div className="flex justify-start w-full sm:w-auto sm:contents mt-2 sm:mt-0">

                {/* Due Date */}
                <div className="flex justify-start sm:justify-center ml-auto sm:ml-0">
                  {task.dueDate ? (
                    <span
                      className={cn(
                        "flex items-center justify-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border",
                        overdue ? "text-red-600 bg-red-500/10 border-red-500/20 shadow-sm" : "text-muted-foreground bg-muted/50 border-border/50"
                      )}
                    >
                      <Clock className="w-3.5 h-3.5 opacity-70" />
                      {new Date(task.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground opacity-50 hidden sm:inline-block">—</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
        </div>
      </div>
    </div>
      
    {/* Modals */}
      {activeTask && (
        <TaskModal
          taskId={activeTask}
          workspaceId={workspaceId}
          onClose={() => setActiveTask(null)}
          onUpdated={() => router.refresh()}
          onDeleted={() => router.refresh()}
        />
      )}
    </>
  );
}
