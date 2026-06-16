"use client";

import React, { useEffect, useState } from "react";
import { Task } from "@/types";
import { Loader2, Search, CheckCircle2, Clock, AlertCircle, ShieldAlert } from "lucide-react";
import { TaskModal } from "@/components/task/TaskModal";
import { useSearchParams } from "next/navigation";

interface Props {
  workspaceId: string;
  userId: string;
}

export function MyTasksClient({ workspaceId, userId }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"my_tasks" | "all_tasks">("all_tasks");
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
      const url = viewMode === "my_tasks" 
        ? `/api/tasks?workspaceId=${workspaceId}&assigneeId=${userId}`
        : `/api/tasks?workspaceId=${workspaceId}`;
        
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      } else {
        setTasks([]);
        console.error("Error from API:", await res.text());
      }
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "high": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "critical": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-muted text-muted-foreground border-transparent";
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = task.title.toLowerCase().includes(searchLower) || 
                          (task.description && task.description.toLowerCase().includes(searchLower));
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleSelectAll = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map(t => t.id)));
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
          await fetch(`/api/tasks/${id}?workspaceId=${workspaceId}`, { method: "DELETE" });
        }
      } else if (action.startsWith("status:")) {
        const status = action.split(":")[1];
        for (const id of Array.from(selectedTasks)) {
          await fetch(`/api/tasks/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workspaceId, status })
          });
        }
      }
      await fetchTasks();
      setSelectedTasks(new Set());
    } catch (error) {
      console.error("Bulk action failed", error);
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
      <div className="flex items-center p-1 bg-muted/50 rounded-lg w-fit border border-border/50">
        <button
          onClick={() => setViewMode("all_tasks")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
            viewMode === "all_tasks"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All Tasks
        </button>
        <button
          onClick={() => setViewMode("my_tasks")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
            viewMode === "my_tasks"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          My Tasks
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search your tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-background border rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/50 outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-background border rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/50 outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
          <option value="critical">Critical Priority</option>
        </select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedTasks.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <span className="text-sm font-semibold text-primary">
            {selectedTasks.size} tasks selected
          </span>
          <div className="flex gap-2">
            <select
              onChange={(e) => executeBulkAction(`status:${e.target.value}`)}
              disabled={bulkActionLoading}
              value=""
              className="bg-background border rounded px-3 py-1 text-xs font-medium cursor-pointer"
            >
              <option value="" disabled>Change Status...</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <button
              onClick={() => executeBulkAction("delete")}
              disabled={bulkActionLoading}
              className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded text-xs font-bold hover:bg-red-500/20"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
            <p>No tasks found matching your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            <div className="bg-muted/30 p-4 border-b border-border/50 flex gap-4">
               <input 
                 type="checkbox" 
                 checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                 onChange={handleSelectAll}
                 className="w-4 h-4 rounded mt-0.5 cursor-pointer"
               />
               <span className="text-xs font-bold text-muted-foreground uppercase">Select All</span>
            </div>
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <input 
                    type="checkbox" 
                    checked={selectedTasks.has(task.id)}
                    onChange={() => toggleTaskSelection(task.id)}
                    className="w-4 h-4 rounded mt-1 cursor-pointer"
                  />
                  <div className="mt-1 cursor-pointer" onClick={() => setSelectedTaskId(task.id)}>
                    {task.status === 'done' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : task.status === 'in_progress' ? (
                      <Clock className="w-5 h-5 text-blue-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </div>
                  <div className="cursor-pointer" onClick={() => setSelectedTaskId(task.id)}>
                    <h4 className="text-sm font-semibold group-hover:text-primary transition-colors flex items-center gap-2">
                      {task.title}
                      {task.blockedBy && task.blockedBy.length > 0 && (
                        <span title="Blocked by another task" className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shadow-sm bg-red-600 flex items-center gap-1 shrink-0">
                          <ShieldAlert className="w-3 h-3" /> Blocked
                        </span>
                      )}
                      {task.labels && task.labels.map((tl: any) => (
                        <span key={tl.label.id} className="text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-sm" style={{ backgroundColor: tl.label.color }}>
                          {tl.label.name}
                        </span>
                      ))}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <span className="font-medium text-foreground/70">{(task as any).project?.name || "Unknown Project"}</span>
                      {task.dueDate && (
                        <>
                          <span>•</span>
                          <span className={new Date(task.dueDate) < new Date() ? "text-red-500 font-medium" : ""}>
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </p>
                    
                    {/* Render Sub-tasks */}
                    {task.subTasks && task.subTasks.length > 0 && (
                      <div className="mt-3 flex flex-col gap-1.5 ml-1 border-l-2 border-muted pl-3">
                        {task.subTasks.map((st: any) => (
                          <div key={st.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                            {st.status === 'done' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-sm border border-muted-foreground/40 shrink-0" />
                            )}
                            <span className={st.status === 'done' ? 'line-through opacity-70' : ''}>
                              {st.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground mr-4">
                    {task.storyPoints != null && (
                      <span title="Story Points" className="flex items-center gap-1 font-mono bg-muted/50 px-2 py-1 rounded">
                        ⭐ {task.storyPoints}
                      </span>
                    )}
                    {(task.estimatedHours != null || task.actualHours != null) && (
                      <span title="Hours (Actual / Estimated)" className="flex items-center gap-1 font-mono bg-muted/50 px-2 py-1 rounded">
                        ⏱️ {task.actualHours || 0} / {task.estimatedHours || 0}h
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
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
            setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
          }}
          onDeleted={(deletedId) => {
            setTasks(tasks.filter(t => t.id !== deletedId));
            setSelectedTaskId(null);
          }}
        />
      )}
    </div>
  );
}
