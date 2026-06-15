"use client";

import React, { useState } from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

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

interface Props {
  columns: Column[];
  workspaceId: string;
}

const COL_HEADER_COLORS: string[] = [
  "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "bg-purple-500/10 text-purple-600 border-purple-500/20",
  "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "bg-rose-500/10 text-rose-600 border-rose-500/20",
  "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
];

export function BoardView({ columns, workspaceId }: Props) {
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const router = useRouter();

  const handleAddTask = async (columnId: string) => {
    if (!newTaskTitle.trim()) return;

    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          columnId,
          title: newTaskTitle.trim(),
        }),
      });
      setNewTaskTitle("");
      setAddingToColumn(null);
      router.refresh();
    } catch {
      // Error handled silently — task creation API is Phase 6
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-280px)] items-start">
      {columns.map((col, idx) => {
        const colorClass = COL_HEADER_COLORS[idx % COL_HEADER_COLORS.length];
        const atLimit = col.taskLimit ? col.tasks.length >= col.taskLimit : false;

        return (
          <div
            key={col.id}
            className="flex-shrink-0 w-72 flex flex-col gap-2"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                    colorClass
                  )}
                >
                  {col.name}
                </span>
                <span
                  className={cn(
                    "text-xs text-muted-foreground font-medium",
                    atLimit && "text-destructive font-semibold"
                  )}
                >
                  {col.tasks.length}
                  {col.taskLimit ? `/${col.taskLimit}` : ""}
                </span>
              </div>
              <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Tasks */}
            <div className="bg-muted/40 rounded-xl p-2 space-y-2 min-h-[120px]">
              {col.tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}

              {/* Add Task Input */}
              {addingToColumn === col.id ? (
                <div className="space-y-2 pt-1">
                  <textarea
                    autoFocus
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAddTask(col.id);
                      }
                      if (e.key === "Escape") {
                        setAddingToColumn(null);
                        setNewTaskTitle("");
                      }
                    }}
                    placeholder="Task title… (Enter to save)"
                    className="w-full text-sm bg-card border rounded-md p-2.5 resize-none outline-none focus:ring-2 ring-primary/50 shadow-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddTask(col.id)}
                      className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Add Task
                    </button>
                    <button
                      onClick={() => { setAddingToColumn(null); setNewTaskTitle(""); }}
                      className="text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingToColumn(col.id)}
                  disabled={atLimit}
                  className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-2 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add task
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
