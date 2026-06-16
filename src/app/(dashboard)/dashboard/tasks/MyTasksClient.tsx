"use client";

import React, { useEffect, useState } from "react";
import { Task } from "@/types";
import { Loader2, Search, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { TaskModal } from "@/components/task/TaskModal";

interface Props {
  workspaceId: string;
  userId: string;
}

export function MyTasksClient({ workspaceId, userId }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"my_tasks" | "all_tasks">("all_tasks");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  
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
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

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

      {/* Task List */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
            <p>No tasks found matching your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="group flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {task.status === 'done' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : task.status === 'in_progress' ? (
                      <Clock className="w-5 h-5 text-blue-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">
                      {task.title}
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
                  </div>
                </div>

                <div className="flex items-center gap-3">
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
