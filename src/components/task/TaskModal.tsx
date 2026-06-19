"use client";

import React, { useState, useEffect } from "react";
import { Task, Column } from "@/types";
import { X, Loader2, ListTodo, Tag, ShieldAlert } from "lucide-react";
import { updateTask, deleteTask, getTaskById, getAllTasks, createSubtask, addDependency } from "@/services/taskService";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO } from "date-fns";
import { getAllMembers, getWorkspaceLabels } from "@/services/workspaceService";
import { getCurrentUser } from "@/services/authService";
import dynamic from "next/dynamic";
import { TaskTimeline } from "./TaskTimeline";
import TaskAttachments from "./TaskAttachments";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

const CustomSelect = ({
  value,
  onChange,
  options,
  className,
  disabled,
  placeholder = "Select..."
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt: any) => String(opt.value) === String(value));

  return (
    <div
      className={`relative ${className} ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      ref={ref}
    >
      <div
        className="w-full h-full bg-background border border-border/50 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/50 outline-none hover:bg-muted transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-background border border-border shadow-lg rounded-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
          {options.map((opt: any) => (
            <div
              key={opt.value}
              className={`px-4 py-3 text-sm cursor-pointer hover:bg-muted transition-colors ${opt.disabled ? "opacity-50 cursor-not-allowed hidden" : ""} ${String(value) === String(opt.value) ? "bg-primary/10 text-primary font-semibold" : "text-foreground"}`}
              onClick={() => {
                if (!opt.disabled) {
                  onChange(opt.value);
                  setIsOpen(false);
                }
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CustomDatePicker = ({
  value,
  onChange,
  className
}: {
  value: string | null;
  onChange: (val: string) => void;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const [currentMonth, setCurrentMonth] = useState(value ? parseISO(value) : new Date());

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedDate = value ? parseISO(value) : null;

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={prevMonth} className="p-1 hover:bg-muted rounded">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-sm font-bold">{format(currentMonth, 'MMMM yyyy')}</span>
        <button type="button" onClick={nextMonth} className="p-1 hover:bg-muted rounded">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const dateFormat = "EE";
    let startDate = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
        const isCurrentMonth = isSameMonth(day, monthStart);
        
        days.push(
          <div
            key={day.toISOString()}
            className={`p-1 flex justify-center items-center text-sm cursor-pointer rounded hover:bg-muted transition-colors ${!isCurrentMonth ? "text-muted-foreground/30" : ""} ${isSelected ? "bg-primary text-primary-foreground hover:bg-primary/90 font-bold" : ""}`}
            onClick={() => onDateClick(cloneDay)}
          >
            <span className="w-8 h-8 flex items-center justify-center rounded-md">{formattedDate}</span>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1 mb-1" key={day.toISOString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <div
        className="w-full h-full bg-background border border-border/50 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/50 outline-none hover:bg-muted transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {selectedDate ? format(selectedDate, 'MMM d, yyyy') : "Select date..."}
        </span>
        <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 bg-background border border-border shadow-lg rounded-xl animate-in fade-in slide-in-from-top-2 w-72 left-0 sm:left-auto sm:-right-8">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
          <div className="pt-3 flex justify-between border-t mt-2">
            <button type="button" onClick={() => { onChange(""); setIsOpen(false); }} className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded hover:bg-muted">Clear</button>
            <button type="button" onClick={() => onDateClick(new Date())} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded hover:bg-muted">Today</button>
          </div>
        </div>
      )}
    </div>
  );
};

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
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      getTaskById(taskId, workspaceId),
      getAllMembers(workspaceId),
      getWorkspaceLabels(workspaceId),
      getAllTasks(workspaceId),
      getCurrentUser()
    ]).then(([taskData, membersData, labelsData, tasksData, userData]) => {
      setTask(taskData);
      setMembers(membersData);
      setWorkspaceLabels(labelsData || []);
      setWorkspaceTasks(tasksData || []);
      setCurrentUser(userData?.user);
      setLoading(false);
    }).catch(err => {
      alert("This task was not found or has been deleted.");
      onClose();
    });
  }, [taskId, workspaceId]);

  const handleAssigneeChange = async (newAssigneeIds: string[]) => {
    if (!task) return;
    setSaving(true);
    try {
      const updated = await updateTask(taskId, { assigneeIds: newAssigneeIds, workspaceId });
      setTask(updated);
      onUpdated(updated);
    } catch (err: any) {
      alert(err.message || "Failed to update assignees. You might not have permission.");
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
    if (task[field] === value) return; // Prevent unnecessary API calls on blur
    setSaving(true);
    try {
      const updated = await updateTask(taskId, { [field]: value, workspaceId });
      setTask(updated);
      onUpdated(updated);
    } catch (err: any) {
      alert(err.message || "Failed to update task. You might not have permission.");
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
    } catch (error: any) {
      alert(error.message || "Failed to delete task. You might not have permission.");
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
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-4 border-b bg-background/80 backdrop-blur-md rounded-t-2xl">
          <div className="flex items-center gap-3">
            <CustomSelect
              value={task.priority}
              onChange={(val: string) => handleUpdate("priority", val)}
              disabled={saving}
              className="w-40 h-9"
              options={[
                { value: "none", label: "No Priority" },
                { value: "low", label: "Low Priority" },
                { value: "medium", label: "Medium Priority" },
                { value: "high", label: "High Priority" },
                { value: "critical", label: "Critical" },
              ]}
            />
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
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</label>
              <CustomDatePicker
                value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null}
                onChange={(val) => handleUpdate("dueDate", val)}
                className="w-full h-10"
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
              <CustomSelect
                className="w-full h-10"
                placeholder="+ Add Label"
                value=""
                onChange={async (labelId: string) => {
                  if (!labelId) return;
                  const selectedLabel = workspaceLabels.find(l => l.id === labelId);
                  if (selectedLabel) {
                    const currentLabelIds = task.labels?.map((l:any) => l.label.id) || [];
                    const newLabelIds = [...currentLabelIds, labelId];
                    const updatedTask = { ...task, labels: [...(task.labels || []), { label: selectedLabel }] };
                    setTask(updatedTask);
                    try {
                      await updateTask(taskId, { workspaceId, labelIds: newLabelIds });
                    } catch(err) {
                      console.error("Failed to update task labels", err);
                    }
                    onUpdated(updatedTask);
                  }
                }}
                options={workspaceLabels.filter(wl => !task.labels?.find((tl:any) => tl.label.id === wl.id)).map(l => ({ value: l.id, label: l.name }))}
              />
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
                
                <CustomSelect
                  className="w-48 h-9"
                  placeholder="+ Add Assignee"
                  value=""
                  onChange={(val: string) => addAssignee(val)}
                  disabled={saving}
                  options={members.filter(m => !task.assignees?.find(a => a.user.id === m.user.id)).map(m => ({ value: m.user.id, label: m.user.name }))}
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blocked By (Dependencies)</label>
              
              {/* Render Existing Dependencies */}
              <div className="flex flex-col gap-2 mb-2">
                {task.blockedBy?.map((dep: any) => {
                  const blockedTask = workspaceTasks.find(t => t.id === dep.blockerTaskId);
                  return blockedTask ? (
                    <div key={dep.blockerTaskId} className="flex items-center justify-between bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-2 rounded-lg text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" />
                        <span>{blockedTask.title}</span>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>

              <CustomSelect
                className="w-full h-10"
                placeholder="+ Add a blocking task..."
                value=""
                onChange={async (dependentTaskId: string) => {
                  if (!dependentTaskId) return;
                  try {
                    await addDependency(taskId, dependentTaskId);
                    const updatedTask = {
                      ...task,
                      blockedBy: [...(task.blockedBy || []), { blockerTaskId: dependentTaskId }]
                    };
                    setTask(updatedTask);
                    onUpdated(updatedTask);
                  } catch (err: any) {
                    alert(err.message || "Failed to add dependency");
                  }
                }}
                options={workspaceTasks
                  .filter(t => t.id !== taskId)
                  .filter(t => !task.blockedBy?.find((dep: any) => dep.blockerTaskId === t.id))
                  .map(t => ({ value: t.id, label: t.title }))}
              />
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
          
          {/* Attachments Section */}
          <TaskAttachments 
            taskId={taskId} 
            currentUser={currentUser} 
          />

          {/* Timeline (Comments and Activity) */}
          <TaskTimeline 
            taskId={taskId} 
            workspaceId={workspaceId} 
            currentUser={currentUser}
            members={members}
          />
        </div>
      </div>
    </div>
  );
}
