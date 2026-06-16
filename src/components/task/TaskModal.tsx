"use client";

import React, { useState, useEffect } from "react";
import { Task, Column } from "@/types";
import { X, Loader2 } from "lucide-react";
import { updateTask, deleteTask } from "@/services/taskService";

interface Props {
  taskId: string;
  workspaceId: string;
  onClose: () => void;
  onUpdated: (task: Task) => void;
  onDeleted: (taskId: string) => void;
}

export function TaskModal({ taskId, workspaceId, onClose, onUpdated, onDeleted }: Props) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/tasks/${taskId}?workspaceId=${workspaceId}`)
      .then((res) => res.json())
      .then((data) => {
        setTask(data);
        setLoading(false);
      });
  }, [taskId, workspaceId]);

  const handleUpdate = async (field: keyof Task, value: any) => {
    if (!task) return;
    setSaving(true);
    try {
      const updated = await updateTask(taskId, { [field]: value, workspaceId });
      setTask(updated);
      onUpdated(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task forever?")) return;
    setSaving(true);
    try {
      await deleteTask(taskId, workspaceId);
      onDeleted(taskId);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (loading || !task) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-background border border-border/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <select
              value={task.priority}
              onChange={(e) => handleUpdate("priority", e.target.value)}
              disabled={saving}
              className="text-xs bg-muted border-transparent rounded-md px-2 py-1 outline-none focus:ring-2 ring-primary/50 uppercase font-bold"
            >
              <option value="none">No Priority</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical</option>
            </select>
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDelete} className="text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-colors">
              Delete
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          <input
            type="text"
            value={task.title}
            onChange={(e) => setTask({ ...task, title: e.target.value })}
            onBlur={(e) => handleUpdate("title", e.target.value)}
            className="w-full text-2xl font-bold bg-transparent border-none outline-none focus:ring-0 p-0 placeholder-muted-foreground"
            placeholder="Task Title"
          />

          <div className="space-y-3">
            <label className="text-sm font-semibold text-muted-foreground">Description</label>
            <textarea
              value={task.description || ""}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              onBlur={(e) => handleUpdate("description", e.target.value)}
              className="w-full min-h-[150px] bg-muted/30 border rounded-xl p-4 text-sm outline-none focus:ring-2 ring-primary/50 resize-y"
              placeholder="Add a more detailed description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</label>
              <input
                type="date"
                value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""}
                onChange={(e) => handleUpdate("dueDate", e.target.value)}
                className="w-full bg-muted/30 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/50"
              />
            </div>
            {/* More fields like Assignees can go here */}
          </div>
        </div>
      </div>
    </div>
  );
}
