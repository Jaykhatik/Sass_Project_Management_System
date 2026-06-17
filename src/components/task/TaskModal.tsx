"use client";

import React, { useState, useEffect } from "react";
import { Task, Column } from "@/types";
import { X, Loader2, ListTodo, Tag } from "lucide-react";
import { updateTask, deleteTask, getTaskById, getAllTasks, createSubtask, addDependency } from "@/services/taskService";
import { getAllMembers, getWorkspaceLabels } from "@/services/workspaceService";
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
  
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");

  const [members, setMembers] = useState<any[]>([]);
  const [workspaceLabels, setWorkspaceLabels] = useState<any[]>([]);
  const [workspaceTasks, setWorkspaceTasks] = useState<Task[]>([]);

  useEffect(() => {
    Promise.all([
      getTaskById(taskId, workspaceId),
      getAllMembers(workspaceId),
      getWorkspaceLabels(workspaceId),
      getAllTasks(workspaceId)
    ]).then(([taskData, membersData, labelsData, tasksData]) => {
      setTask(taskData);
      setMembers(membersData);
      setWorkspaceLabels(labelsData || []);
      setWorkspaceTasks(tasksData || []);
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
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const createSubTask = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newSubTaskTitle.trim()) {
      e.preventDefault();
      setSaving(true);
      try {
        const newSubTask = await createSubtask(taskId, {
          title: newSubTaskTitle.trim(),
        });
          const updatedTask = {
            ...task!,
            subTasks: [...(task!.subTasks || []), newSubTask]
          };
        setTask(updatedTask);
        onUpdated(updatedTask);
        setNewSubTaskTitle("");
      } catch (error) {
        console.error("Failed to create sub-task", error);
      } finally {
        setSaving(false);
      }
    }
  };

  const toggleSubTask = async (subTaskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    try {
      const updatedSubTask = await updateTask(subTaskId, { workspaceId, status: newStatus });
      const updatedSubTasks = task!.subTasks?.map(st => st.id === subTaskId ? updatedSubTask : st) || [];
        const updatedTask = { ...task!, subTasks: updatedSubTasks };
      setTask(updatedTask);
      onUpdated(updatedTask);
    } catch (error) {
      console.error("Failed to toggle sub-task", error);
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
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Labels</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {task.labels?.map((l: any) => (
                  <span key={l.label.id} style={{ backgroundColor: l.label.color }} className="text-xs font-bold text-white px-2 py-1 rounded">
                    {l.label.name}
                  </span>
                ))}
              </div>
              <select
                className="w-full bg-muted/30 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/50"
                onChange={async (e) => {
                  const labelId = e.target.value;
                  if (!labelId) return;
                  
                  const selectedLabel = workspaceLabels.find(l => l.id === labelId);
                  if (selectedLabel) {
                    const currentLabelIds = task.labels?.map((l:any) => l.label.id) || [];
                    const newLabelIds = [...currentLabelIds, labelId];
                    
                    // Optimistic UI Update
                    const updatedTask = { ...task, labels: [...(task.labels || []), { label: selectedLabel }] };
                    setTask(updatedTask);
                    
                    // Database Save
                    try {
                      await updateTask(taskId, { workspaceId, labelIds: newLabelIds });
                    } catch(err) {
                      console.error("Failed to update task labels", err);
                    }
                    
                    onUpdated(updatedTask);
                  }
                }}
                value=""
              >
                <option value="" disabled>+ Add Label</option>
                {workspaceLabels.filter(wl => !task.labels?.find((tl:any) => tl.label.id === wl.id)).map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Story Points</label>
              <input
                type="number"
                min="0"
                value={task.storyPoints || ""}
                onChange={(e) => setTask({ ...task, storyPoints: e.target.value ? parseInt(e.target.value) : null })}
                onBlur={(e) => handleUpdate("storyPoints", task.storyPoints)}
                className="w-full bg-muted/30 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/50"
                placeholder="e.g. 5"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estimated Hours</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={task.estimatedHours || ""}
                onChange={(e) => setTask({ ...task, estimatedHours: e.target.value ? parseFloat(e.target.value) : null })}
                onBlur={(e) => handleUpdate("estimatedHours", task.estimatedHours)}
                className="w-full bg-muted/30 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/50"
                placeholder="e.g. 8"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actual Hours</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={task.actualHours || ""}
                onChange={(e) => setTask({ ...task, actualHours: e.target.value ? parseFloat(e.target.value) : null })}
                onBlur={(e) => handleUpdate("actualHours", task.actualHours)}
                className="w-full bg-muted/30 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/50"
                placeholder="e.g. 4.5"
              />
            </div>
          </div>

          <div className="pt-4">
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

          <div className="pt-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blocked By (Dependencies)</label>
              <select
                className="w-full bg-muted/30 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/50"
                onChange={async (e) => {
                  const dependentTaskId = e.target.value;
                  if (!dependentTaskId) return;
                  try {
                    await addDependency(taskId, dependentTaskId);
                    // UI update handled silently
                  } catch (err) {
                    console.error("Failed to add dependency", err);
                  }
                }}
                value=""
              >
                <option value="" disabled>Select a blocking task...</option>
                {workspaceTasks.filter(t => t.id !== taskId).map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sub-tasks Section */}
          <div className="pt-6 border-t border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <ListTodo className="w-4 h-4" />
                <span>Sub-Tasks</span>
              </div>
              {task.subTasks && task.subTasks.length > 0 && (
                <span className="text-xs font-medium text-muted-foreground">
                  {task.subTasks.filter(st => st.status === 'done').length} / {task.subTasks.length}
                </span>
              )}
            </div>
            
            {/* Progress Bar */}
            {task.subTasks && task.subTasks.length > 0 && (
              <div className="w-full bg-muted rounded-full h-1.5 mb-4">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${(task.subTasks.filter(st => st.status === 'done').length / task.subTasks.length) * 100}%` }}
                ></div>
              </div>
            )}

            <div className="space-y-2">
              {task.subTasks?.map((subTask: any) => (
                <div key={subTask.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/50 group">
                  <input 
                    type="checkbox" 
                    checked={subTask.status === "done"}
                    onChange={() => toggleSubTask(subTask.id, subTask.status)}
                    className="w-4 h-4 rounded border-muted-foreground/30 text-primary focus:ring-primary/50 cursor-pointer" 
                  />
                  <span className={`text-sm font-medium ${subTask.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                    {subTask.title}
                  </span>
                </div>
              ))}
              <input
                type="text"
                value={newSubTaskTitle}
                onChange={(e) => setNewSubTaskTitle(e.target.value)}
                onKeyDown={createSubTask}
                disabled={saving}
                placeholder="+ Add Sub-task (Press Enter)"
                className="w-full bg-transparent border-none text-sm font-medium outline-none placeholder:text-muted-foreground/50 pt-2 focus:ring-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
