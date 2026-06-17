"use client";

import React, { useEffect, useState, useRef } from "react";

const CustomSelect = ({
  value,
  onChange,
  options,
  className,
  disabled,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption =
    options.find((opt: any) => opt.value === value) || options[0];

  return (
    <div
      className={`relative ${className} ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      ref={ref}
    >
      <div
        className="w-full h-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/50 outline-none hover:bg-muted transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : "Select..."}
        </span>
        <svg
          className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-background border border-border shadow-lg rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          {options.map((opt: any) => (
            <div
              key={opt.value}
              className={`px-4 py-3 text-sm cursor-pointer hover:bg-muted transition-colors ${opt.disabled ? "opacity-50 cursor-not-allowed" : ""} ${value === opt.value ? "bg-primary/10 text-primary font-semibold" : "text-foreground"}`}
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
import { Task } from "@/types";
import {
  Loader2,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { TaskModal } from "@/components/task/TaskModal";
import { useSearchParams } from "next/navigation";
import { getAllTasks, updateTask, deleteTask } from "@/services/taskService";

interface Props {
  workspaceId: string;
  userId: string;
}

export function MyTasksClient({ workspaceId, userId }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"my_tasks" | "all_tasks">(
    "all_tasks",
  );
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q");
  const [search, setSearch] = useState(queryParam || "");

  useEffect(() => {
    if (queryParam !== null) {
      setSearch(queryParam);
    }
  }, [queryParam]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [workspaceId, userId, viewMode]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = viewMode === "my_tasks"
        ? await getAllTasks(workspaceId, { assigneeId: userId })
        : await getAllTasks(workspaceId);
      
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.15)] backdrop-blur-sm";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.15)] backdrop-blur-sm";
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.15)] backdrop-blur-sm";
      case "critical":
        return "bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.15)] backdrop-blur-sm";
      default:
        return "bg-muted/40 text-muted-foreground border-transparent backdrop-blur-sm";
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      task.title.toLowerCase().includes(searchLower) ||
      (task.description &&
        task.description.toLowerCase().includes(searchLower));
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleSelectAll = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map((t) => t.id)));
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const executeBulkAction = async (action: string) => {
    if (selectedTasks.size === 0) return;
    setBulkActionLoading(true);
    try {
      if (action === "delete") {
        for (const id of Array.from(selectedTasks)) {
          await deleteTask(id, workspaceId);
        }
      } else if (action.startsWith("status:")) {
        const status = action.split(":")[1];
        for (const id of Array.from(selectedTasks)) {
          await updateTask(id, { workspaceId, status });
        }
      }
      await fetchTasks();
      setSelectedTasks(new Set());
    } catch (error: any) {
      alert(error.message || "Bulk action failed. You might not have permission to modify some of these tasks.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-center w-full mb-2">
        <div className="flex items-center p-1 bg-muted/40 backdrop-blur-md rounded-lg w-fit max-w-full overflow-x-auto border border-border/40 shadow-sm whitespace-nowrap scrollbar-hide">
          <button
            onClick={() => setViewMode("all_tasks")}
            className={`px-6 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${
              viewMode === "all_tasks"
                ? "bg-background text-foreground shadow-md border border-border/50 scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setViewMode("my_tasks")}
            className={`px-6 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${
              viewMode === "my_tasks"
                ? "bg-background text-foreground shadow-md border border-border/50 scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            My Tasks
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-muted/20 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-sm relative z-30">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none rounded-2xl" />
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search your tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background/60 backdrop-blur-sm border border-border/50 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all hover:bg-background/80"
          />
        </div>

        <CustomSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "All Statuses" },
            { value: "todo", label: "To Do" },
            { value: "in_progress", label: "In Progress" },
            { value: "in_review", label: "In Review" },
            { value: "done", label: "Done" },
          ]}
          className="w-full md:w-48"
        />

        <CustomSelect
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={[
            { value: "all", label: "All Priorities" },
            { value: "low", label: "Low Priority" },
            { value: "medium", label: "Medium Priority" },
            { value: "high", label: "High Priority" },
            { value: "critical", label: "Critical Priority" },
          ]}
          className="w-full md:w-48"
        />
      </div>

      {/* Bulk Actions Bar */}
      {selectedTasks.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 relative z-20">
          <span className="text-sm font-semibold text-primary">
            {selectedTasks.size} tasks selected
          </span>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <CustomSelect
              value=""
              onChange={(val: string) => {
                if (val) executeBulkAction(`status:${val}`);
              }}
              disabled={bulkActionLoading}
              options={[
                { value: "", label: "Change Status...", disabled: true },
                { value: "todo", label: "To Do" },
                { value: "in_progress", label: "In Progress" },
                { value: "in_review", label: "In Review" },
                { value: "done", label: "Done" },
              ]}
              className="w-full sm:w-48 flex-1 sm:flex-none"
            />
            <button
              onClick={() => executeBulkAction("delete")}
              disabled={bulkActionLoading}
              className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded text-xs font-bold hover:bg-red-500/20 flex-1 sm:flex-none whitespace-nowrap text-center"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-20 pointer-events-none" />
        {filteredTasks.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle2 className="w-8 h-8 opacity-40 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground/80 mb-2">
              You're all caught up!
            </h3>
            <p className="text-sm max-w-[250px]">
              No tasks found matching your filters. Take a break or create a new
              task.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30 relative">
            <div className="bg-muted/20 backdrop-blur-md p-4 border-b border-border/40 flex gap-4 sticky top-0 z-10">
              <input
                type="checkbox"
                checked={
                  selectedTasks.size === filteredTasks.length &&
                  filteredTasks.length > 0
                }
                onChange={handleSelectAll}
                className="w-4 h-4 rounded mt-0.5 cursor-pointer accent-primary"
              />
              <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase">
                Select All
              </span>
            </div>
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/50 transition-all duration-300 gap-3 sm:gap-0 relative overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-primary/80 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1 z-10">
                  <input
                    type="checkbox"
                    checked={selectedTasks.has(task.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => toggleTaskSelection(task.id)}
                    className="w-4 h-4 rounded mt-1 cursor-pointer shrink-0 accent-primary"
                  />
                  <div
                    className="mt-1 shrink-0"
                  >
                    {task.status === "done" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : task.status === "in_progress" ? (
                      <Clock className="w-5 h-5 text-blue-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </div>
                  <div
                    className="min-w-0"
                  >
                    <h4 className="text-sm font-semibold group-hover:text-primary transition-colors flex flex-wrap items-center gap-2">
                      {task.title}
                      {task.blockedBy && task.blockedBy.length > 0 && (
                        <span
                          title="Blocked by another task"
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shadow-sm bg-red-600 flex items-center gap-1 shrink-0"
                        >
                          <ShieldAlert className="w-3 h-3" /> Blocked
                        </span>
                      )}
                      {task.labels &&
                        task.labels.map((tl: any) => (
                          <span
                            key={tl.label.id}
                            className="text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-sm"
                            style={{ backgroundColor: tl.label.color }}
                          >
                            {tl.label.name}
                          </span>
                        ))}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground/70 truncate max-w-full">
                        {(task as any).project?.name || "Unknown Project"}
                      </span>
                      {task.dueDate && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span
                            className={`shrink-0 ${new Date(task.dueDate) < new Date() ? "text-red-500 font-medium" : ""}`}
                          >
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </p>

                    {/* Render Sub-tasks Summary */}
                    {task.subTasks && task.subTasks.length > 0 && (() => {
                      const completedCount = task.subTasks.filter((st:any) => st.status === 'done').length;
                      const totalCount = task.subTasks.length;
                      const allDone = completedCount === totalCount;
                      
                      return (
                        <div className="mt-2.5">
                          <span 
                            title={`${completedCount} of ${totalCount} sub-tasks completed`}
                            className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded border shadow-sm transition-colors ${
                              allDone 
                                ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" 
                                : "text-muted-foreground bg-muted/60 border-border/50"
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-3 h-3 ${allDone ? "opacity-100" : "opacity-70"}`}>
                              <polyline points="9 11 12 14 22 4"></polyline>
                              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                            </svg>
                            {completedCount}/{totalCount}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:ml-4 ml-9 sm:mt-0">
                  <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground mr-4">
                    {task.storyPoints != null && (
                      <span
                        title="Story Points"
                        className="flex items-center gap-1 font-mono bg-muted/50 px-2 py-1 rounded"
                      >
                        ⭐ {task.storyPoints}
                      </span>
                    )}
                    {(task.estimatedHours != null ||
                      task.actualHours != null) && (
                      <span
                        title="Hours (Actual / Estimated)"
                        className="flex items-center gap-1 font-mono bg-muted/50 px-2 py-1 rounded"
                      >
                        ⏱️ {task.actualHours || 0} / {task.estimatedHours || 0}h
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority || "No Priority"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Re-use the exact same Task Modal from the Kanban board! */}
      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          workspaceId={workspaceId}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={(updatedTask) => {
            setTasks(
              tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
            );
          }}
          onDeleted={(deletedId) => {
            setTasks(tasks.filter((t) => t.id !== deletedId));
            setSelectedTaskId(null);
          }}
        />
      )}
    </div>
  );
}
