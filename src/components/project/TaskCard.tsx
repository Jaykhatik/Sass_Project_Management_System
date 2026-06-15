"use client";

import React from "react";
import { AlertCircle, ArrowUp, Minus, ArrowDown, Clock } from "lucide-react";
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

interface Props {
  task: Task;
  onClick?: (task: Task) => void;
}

const PRIORITY_ICON: Record<string, React.ReactNode> = {
  critical: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
  high: <ArrowUp className="w-3.5 h-3.5 text-orange-500" />,
  medium: <Minus className="w-3.5 h-3.5 text-yellow-500" />,
  low: <ArrowDown className="w-3.5 h-3.5 text-blue-400" />,
  none: <Minus className="w-3.5 h-3.5 text-muted-foreground" />,
};

function isOverdue(dueDate: string) {
  return new Date(dueDate) < new Date();
}

export function TaskCard({ task, onClick }: Props) {
  const overdue = task.dueDate && isOverdue(task.dueDate);

  return (
    <div
      onClick={() => onClick?.(task)}
      className={cn(
        "bg-card border rounded-lg p-3 space-y-2.5 cursor-pointer",
        "hover:shadow-md hover:-translate-y-0.5 transition-all group",
        "active:scale-[0.98]"
      )}
    >
      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {task.labels.map(({ label }) => (
            <span
              key={label.id}
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `${label.color}25`,
                color: label.color,
                border: `1px solid ${label.color}40`,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
        {task.title}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-2">
          {/* Priority */}
          <span title={task.priority} className="flex items-center">
            {PRIORITY_ICON[task.priority] ?? PRIORITY_ICON.none}
          </span>

          {/* Due date */}
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                overdue ? "text-destructive font-medium" : "text-muted-foreground"
              )}
            >
              <Clock className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>

        {/* Assignees */}
        {task.assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {task.assignees.slice(0, 3).map(({ user }) => (
              <div
                key={user.id}
                title={user.name ?? "Unknown"}
                className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-card flex items-center justify-center text-white text-[8px] font-bold"
              >
                {(user.name ?? "U").charAt(0).toUpperCase()}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[8px] text-muted-foreground font-medium">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
