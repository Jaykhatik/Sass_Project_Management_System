"use client";

import React, { useState, useEffect } from "react";
import { Sprint, Task, Project } from "@/types";
import { getSprints, createSprint, startSprint, completeSprint } from "@/services/sprintService";
import { getAllTasks, updateTask } from "@/services/taskService";
import { TaskCard } from "@/components/task/TaskCard";
import { BurndownChart } from "@/components/project/BurndownChart";
import { Plus, MoreHorizontal, CheckCircle2, Play, Archive } from "lucide-react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  workspaceId: string;
  projectId: string;
  project: Project;
}

export function BacklogView({ workspaceId, projectId, project }: Props) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [workspaceId, projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedSprints, fetchedTasks] = await Promise.all([
        getSprints(workspaceId, projectId),
        getAllTasks(workspaceId, { projectId, sprintId: "null" }),
      ]);
      setSprints(fetchedSprints);
      setBacklogTasks(fetchedTasks);
    } catch (error) {
      console.error("Failed to fetch backlog data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSprint = async () => {
    try {
      const name = `Sprint ${sprints.length + 1}`;
      const newSprint = await createSprint(workspaceId, projectId, { name });
      setSprints([...sprints, newSprint]);
      toast.success("Sprint created");
    } catch (error: any) {
      toast.error(error.message || "Failed to create sprint");
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(); // 2 weeks default
    try {
      const started = await startSprint(workspaceId, sprintId, { startDate, endDate });
      setSprints(sprints.map(s => s.id === sprintId ? started : s));
      toast.success("Sprint started");
    } catch (error: any) {
      toast.error(error.message || "Failed to start sprint");
    }
  };

  const handleCompleteSprint = async (sprintId: string) => {
    if (!confirm("Are you sure you want to complete this sprint? Unfinished tasks will be moved to the backlog.")) return;
    try {
      await completeSprint(workspaceId, sprintId, "move_to_backlog");
      toast.success("Sprint completed");
      fetchData(); // Refresh everything
    } catch (error: any) {
      toast.error(error.message || "Failed to complete sprint");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetSprintId: string | null) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const sourceSprintId = e.dataTransfer.getData("sourceSprintId") || null;
    
    // Normalize "null" string
    const normalizedTargetSprintId = targetSprintId === "null" ? null : targetSprintId;
    const normalizedSourceSprintId = sourceSprintId === "null" ? null : sourceSprintId;

    if (!taskId || normalizedSourceSprintId === normalizedTargetSprintId) return;

    try {
      await updateTask(taskId, { workspaceId, sprintId: normalizedTargetSprintId } as any);
      toast.success("Task sprint updated");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to move task");
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeSprint = sprints.find(s => s.status === "active");
  const plannedSprints = sprints.filter(s => s.status === "planned");
  const completedSprints = sprints.filter(s => s.status === "completed");

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      
      {/* Active Sprint Section */}
      {activeSprint && (
        <div 
          className="border border-primary/30 bg-primary/5 rounded-2xl p-6"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, activeSprint.id)}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" />
                {activeSprint.name}
              </h2>
              <p className="text-sm text-muted-foreground">Active Sprint • Ends {new Date(activeSprint.endDate!).toLocaleDateString()}</p>
            </div>
            <button 
              onClick={() => handleCompleteSprint(activeSprint.id)}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Complete Sprint
            </button>
          </div>
          <div className="space-y-4 min-h-[50px]">
            <p className="text-sm text-muted-foreground">{activeSprint.tasks?.length || 0} tasks in this sprint. View them on the Board.</p>
            {activeSprint.tasks && activeSprint.tasks.length > 0 && (
              <div className="mt-8">
                <BurndownChart sprint={activeSprint} tasks={activeSprint.tasks as any} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Planned Sprints */}
      {plannedSprints.map(sprint => (
        <div 
          key={sprint.id} 
          className="border border-border/50 bg-background/50 backdrop-blur-xl rounded-2xl p-6 shadow-sm"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, sprint.id)}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">{sprint.name}</h2>
              <p className="text-sm text-muted-foreground">Planned Sprint • {sprint.tasks?.length || 0} {sprint.tasks?.length === 1 ? 'task' : 'tasks'}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleStartSprint(sprint.id)}
                disabled={!!activeSprint || (sprint.tasks?.length || 0) === 0}
                className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Start Sprint
              </button>
            </div>
          </div>
          <div className="min-h-[50px] border-2 border-dashed border-border/50 rounded-xl p-4 flex flex-col gap-3 text-muted-foreground text-sm">
            {sprint.tasks && sprint.tasks.length > 0 ? (
              sprint.tasks.map((task: any) => (
                <div 
                  key={task.id} 
                  draggable 
                  onDragStart={(e) => {
                    e.dataTransfer.setData("taskId", task.id);
                    e.dataTransfer.setData("sourceSprintId", sprint.id);
                  }}
                  className="cursor-move"
                >
                  <TaskCard task={task} onClick={() => {}} />
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center py-4">
                Drag tasks here from the backlog
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Backlog Section */}
      <div 
        className="border border-border/50 bg-background/50 backdrop-blur-xl rounded-2xl p-6 shadow-sm"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, "null")}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Backlog</h2>
            <p className="text-sm text-muted-foreground">{backlogTasks.length} unassigned {backlogTasks.length === 1 ? 'task' : 'tasks'}</p>
          </div>
          <button 
            onClick={handleCreateSprint}
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Sprint
          </button>
        </div>
        <div className="space-y-3">
          {backlogTasks.map(task => (
            <div 
              key={task.id} 
              draggable 
              onDragStart={(e) => {
                e.dataTransfer.setData("taskId", task.id);
                e.dataTransfer.setData("sourceSprintId", "null");
              }}
              className="cursor-move"
            >
              <TaskCard task={task} onClick={() => {}} />
            </div>
          ))}
          {backlogTasks.length === 0 && (
            <div className="py-10 text-center text-muted-foreground text-sm">
              Your backlog is empty. Create some tasks on the Board!
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
