"use client";

import React, { useState } from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import { TaskCard } from "@/components/task/TaskCard";
import { CreateTaskDialog } from "@/components/task/CreateTaskDialog";
import { TaskModal } from "@/components/task/TaskModal";
import { reorderTasks } from "@/services/taskService";
import { Column, Task } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  columns: Column[];
  workspaceId: string;
  projectId: string;
  boardId: string;
}

const COL_HEADER_COLORS: string[] = [
  "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "bg-purple-500/10 text-purple-600 border-purple-500/20",
  "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "bg-rose-500/10 text-rose-600 border-rose-500/20",
  "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
];

export function BoardView({ columns: initialColumns, workspaceId, projectId, boardId }: Props) {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [creatingInCol, setCreatingInCol] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const sourceColumnId = e.dataTransfer.getData("sourceColumnId");

    if (!taskId || sourceColumnId === targetColumnId) return;

    // Optimistic UI update
    setColumns((prev) => {
      const newCols = prev.map(c => ({ ...c, tasks: [...c.tasks] }));
      const srcColIndex = newCols.findIndex((c) => c.id === sourceColumnId);
      const destColIndex = newCols.findIndex((c) => c.id === targetColumnId);

      if (srcColIndex === -1 || destColIndex === -1) return prev;

      const taskIndex = newCols[srcColIndex].tasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return prev;

      const [task] = newCols[srcColIndex].tasks.splice(taskIndex, 1);
      
      // Update task column
      const updatedTask = { ...task };
      // Note: we'd ideally set columnId on task if we maintained it, but we can just push it
      newCols[destColIndex].tasks.push(updatedTask);
      
      return newCols;
    });

    try {
      // Find the task's boardId (we can pass boardId from props or context ideally)
      // Since reorder API expects boardId, and we need position, we simplify here:
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, columnId: targetColumnId }),
      });
      // We are just patching the columnId for now, a full reorder API with position logic would go here
    } catch (err) {
      console.error(err);
      // Revert could be handled here
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
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
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

            {/* Tasks container */}
            <div className="bg-muted/40 rounded-xl p-2 space-y-2 min-h-[120px]">
              {col.tasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={{...task, columnId: col.id} as any} // Ensure columnId exists for dragging
                  onClick={() => setActiveTask(task.id)} 
                />
              ))}

              <button
                onClick={() => setCreatingInCol(col.id)}
                disabled={atLimit}
                className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-2 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                Add task
              </button>
            </div>
          </div>
        );
      })}

      {/* Add Column Button */}
      <div className="flex-shrink-0 w-72">
        <button className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-dashed border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all">
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      </div>

      {/* Modals */}
      {creatingInCol && (
        <CreateTaskDialog
          workspaceId={workspaceId}
          projectId={projectId}
          boardId={boardId}
          columnId={creatingInCol}
          onClose={() => setCreatingInCol(null)}
          onCreated={(task) => {
            setColumns(columns.map(c => c.id === creatingInCol ? { ...c, tasks: [...c.tasks, task] } : c));
          }}
        />
      )}

      {activeTask && (
        <TaskModal
          taskId={activeTask}
          workspaceId={workspaceId}
          onClose={() => setActiveTask(null)}
          onUpdated={(updated) => {
            setColumns(columns.map(c => ({
              ...c,
              tasks: c.tasks.map(t => t.id === updated.id ? updated : t)
            })));
          }}
          onDeleted={(id) => {
            setColumns(columns.map(c => ({
              ...c,
              tasks: c.tasks.filter(t => t.id !== id)
            })));
          }}
        />
      )}
    </div>
  );
}
