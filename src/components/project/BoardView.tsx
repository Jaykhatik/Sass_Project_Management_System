"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, MoreHorizontal } from "lucide-react";
import { TaskCard } from "@/components/task/TaskCard";
import { CreateTaskDialog } from "@/components/task/CreateTaskDialog";
import { TaskModal } from "@/components/task/TaskModal";
import { reorderTasks, updateTask } from "@/services/taskService";
import { Column, Task } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  columns: Column[];
  workspaceId: string;
  projectId: string;
  boardId: string;
}

const COL_HEADER_COLORS: string[] = [
  "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 shadow-sm",
  "bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-sm",
  "bg-purple-500/10 text-purple-600 border-purple-500/20 shadow-sm",
  "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm",
  "bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-sm",
  "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 shadow-sm",
];

export function BoardView({ columns: initialColumns, workspaceId, projectId, boardId }: Props) {
  const router = useRouter();
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [creatingInCol, setCreatingInCol] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<string | null>(null);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const sourceColumnId = e.dataTransfer.getData("sourceColumnId");

    if (!taskId || sourceColumnId === targetColumnId) return;

    const previousColumns = [...columns];

    // Optimistic UI update
    setColumns((prev) => {
      const newCols = prev.map(c => ({ ...c, tasks: [...c.tasks] }));
      const srcColIndex = newCols.findIndex((c) => c.id === sourceColumnId);
      const destColIndex = newCols.findIndex((c) => c.id === targetColumnId);

      if (srcColIndex === -1 || destColIndex === -1) return prev;

      const taskIndex = newCols[srcColIndex].tasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return prev;

      const [task] = newCols[srcColIndex].tasks.splice(taskIndex, 1);
      
      // Update task column and dynamically map status
      const updatedTask = { ...task };
      const targetColDef = newCols[destColIndex];
      let newStatus = "todo";
      if (targetColDef) {
        const name = targetColDef.name.toLowerCase();
        if (name.includes("done") || name.includes("complete")) newStatus = "done";
        else if (name.includes("progress")) newStatus = "in_progress";
        else if (name.includes("review")) newStatus = "in_review";
      }
      updatedTask.status = newStatus;
      
      newCols[destColIndex].tasks.push(updatedTask);
      
      return newCols;
    });

    try {
      const targetColDef = columns.find(c => c.id === targetColumnId);
      let newStatus = "todo";
      if (targetColDef) {
        const name = targetColDef.name.toLowerCase();
        if (name.includes("done") || name.includes("complete")) newStatus = "done";
        else if (name.includes("progress")) newStatus = "in_progress";
        else if (name.includes("review")) newStatus = "in_review";
      }

      await updateTask(taskId, {
        workspaceId,
        columnId: targetColumnId,
        status: newStatus,
      });
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to move task. You might not have permission.");
      setColumns(previousColumns);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-8 pt-2 min-h-[calc(100vh-320px)] items-start snap-x snap-mandatory sm:snap-none [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-track]:bg-transparent transition-colors">
      {columns.map((col, idx) => {
        const colorClass = COL_HEADER_COLORS[idx % COL_HEADER_COLORS.length];
        const atLimit = col.taskLimit ? col.tasks.length >= col.taskLimit : false;

        return (
          <div
            key={col.id}
            className="flex-shrink-0 flex-1 min-w-[250px] max-w-[320px] flex flex-col gap-3 snap-center"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "text-[11px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-lg border",
                    colorClass
                  )}
                >
                  {col.name}
                </span>
                <span
                  className={cn(
                    "text-xs font-bold bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-md border border-border/50 shadow-sm",
                    atLimit && "bg-destructive/10 text-destructive border-destructive/20"
                  )}
                >
                  {col.tasks.length}
                  {col.taskLimit ? ` / ${col.taskLimit}` : ""}
                </span>
              </div>
              <button className="p-1.5 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border/50">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Tasks container */}
            <div className="bg-card/40 backdrop-blur-xl border border-border/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-2.5 space-y-3 min-h-[150px] flex flex-col transition-all">
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
                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-xl px-2 py-2.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
          </div>
        );
      })}
      


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
            router.refresh();
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
            router.refresh();
          }}
          onDeleted={(id) => {
            setColumns(columns.map(c => ({
              ...c,
              tasks: c.tasks.filter(t => t.id !== id)
            })));
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
