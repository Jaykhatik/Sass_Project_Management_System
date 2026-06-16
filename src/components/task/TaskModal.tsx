"use client";

import React, { useState, useEffect } from "react";
import { Task, Column } from "@/types";
import { X, Loader2, ListTodo, Tag } from "lucide-react";
import { updateTask, deleteTask } from "@/services/taskService";
import dynamic from "next/dynamic";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

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

  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/tasks/${taskId}?workspaceId=${workspaceId}`).then(res => res.json()),
      fetch(`/api/workspaces/${workspaceId}/members`).then(res => res.json())
    ]).then(([taskData, membersData]) => {
      setTask(taskData);
      setMembers(membersData);
      setLoading(false);
    });
  }, [taskId, workspaceId]);

  const handleAssigneeChange = async (newAssigneeIds: string[]) => {
    if (!task) return;
    setSaving(true);
    try {
      const updated = await updateTask(taskId, { assigneeIds: newAssigneeIds, workspaceId });
      setTask(updated);
      onUpdated(updated);
    } finally {
      setSaving(false);
    }
  };

  const addAssignee = (userId: string) => {
    if (!task) return;
    const currentIds = task.assignees?.map(a => a.user.id) || [];
    handleAssigneeChange([...currentIds, userId]);
  };

  const removeAssignee = (userId: string) => {
    if (!task) return;
    const currentIds = task.assignees?.map(a => a.user.id) || [];
    handleAssigneeChange(currentIds.filter(id => id !== userId));
  };

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

          <div className="space-y-3" data-color-mode="dark">
            <label className="text-sm font-semibold text-muted-foreground">Description</label>
            <div onBlur={() => handleUpdate("description", task.description)}>
              <MDEditor
                value={task.description || ""}
                onChange={(val) => setTask({ ...task, description: val || "" })}
                preview="edit"
                height={200}
                className="w-full bg-muted/30 border rounded-xl overflow-hidden shadow-none outline-none focus-within:ring-2 ring-primary/50"
              />
            </div>
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
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assignees</label>
              <div className="flex flex-wrap gap-2 items-center">
                {task.assignees?.map(a => (
                   <div key={a.user.id} className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2.5 py-1 rounded-md text-xs font-bold">
                     <div className="w-4 h-4 rounded bg-indigo-500 text-white flex items-center justify-center text-[8px] uppercase">
                        {a.user.name?.charAt(0)}
                     </div>
                     {a.user.name}
                     <button onClick={() => removeAssignee(a.user.id)} className="hover:text-destructive transition-colors ml-1" disabled={saving}>
                       <X className="w-3 h-3" />
                     </button>
                   </div>
                ))}
                
                <select 
                  className="bg-muted/50 border border-dashed border-muted-foreground/30 text-muted-foreground rounded-md px-2 py-1 text-xs outline-none focus:ring-2 ring-primary/50 font-medium cursor-pointer"
                  value=""
                  onChange={(e) => addAssignee(e.target.value)}
                  disabled={saving}
                >
                  <option value="" disabled>+ Add Assignee</option>
                  {members.filter(m => !task.assignees?.find(a => a.user.id === m.user.id)).map(m => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sub-tasks Section */}
          <div className="pt-6 border-t border-border/50 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <ListTodo className="w-4 h-4" />
              <span>Sub-Tasks</span>
            </div>
            <div className="space-y-2">
              {/* Example static sub-tasks until Phase 7 API is ready */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/50 group">
                <input type="checkbox" className="w-4 h-4 rounded border-muted-foreground/30 text-primary focus:ring-primary/50 cursor-pointer" />
                <span className="text-sm font-medium">Design Header Component</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/50 group">
                <input type="checkbox" className="w-4 h-4 rounded border-muted-foreground/30 text-primary focus:ring-primary/50 cursor-pointer" />
                <span className="text-sm font-medium">Connect PostgreSQL Database</span>
              </div>
              <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors pt-2">
                + Add Sub-task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
