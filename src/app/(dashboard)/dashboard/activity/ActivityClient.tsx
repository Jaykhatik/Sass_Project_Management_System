"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { ActivityLog } from "@/types";
import { getWorkspaceActivity } from "@/services/activityService";
import { getAllMembers } from "@/services/workspaceService";
import { getProjectsClient } from "@/services/projectClientService";
import { Loader2, Activity, Filter, RefreshCcw } from "lucide-react";
import { TaskModal } from "@/components/task/TaskModal";

const CustomSelect = ({
  value,
  onChange,
  options,
  className,
  disabled,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

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
    options.find((opt: any) => String(opt.value) === String(value)) || options[0];

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
              className={`px-4 py-3 text-sm cursor-pointer hover:bg-muted transition-colors ${opt.disabled ? "opacity-50 cursor-not-allowed" : ""} ${String(value) === String(opt.value) ? "bg-primary/10 text-primary font-semibold" : "text-foreground"}`}
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

function formatDistanceToNowNative(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

export function ActivityClient({ workspaceId }: { workspaceId: string }) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [members, setMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const [selectedMember, setSelectedMember] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (workspaceId) {
      loadData();
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId && !loading) {
      handleRefresh();
    }
  }, [selectedMember, selectedProject]);

  const loadData = async () => {
    try {
      const [activityData, membersData, projectsData] = await Promise.all([
        getWorkspaceActivity(workspaceId),
        getAllMembers(workspaceId),
        getProjectsClient(workspaceId)
      ]);
      setLogs(activityData || []);
      setMembers(membersData || []);
      setProjects(projectsData?.projects || []);
    } catch (error) {
      console.error("Failed to load activity page data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getWorkspaceActivity(workspaceId, selectedProject, selectedMember);
      setLogs(data || []);
    } catch (error) {
      console.error("Failed to refresh activity", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workspace Activity</h1>
          <p className="text-sm text-muted-foreground">Monitor all events across the workspace</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 border rounded-full hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50 w-full sm:w-auto flex justify-center items-center gap-2 sm:gap-0"
          title="Refresh"
        >
          <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          <span className="sm:hidden text-sm font-medium">Refresh</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl border bg-card text-card-foreground">
        <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground font-medium w-full sm:w-auto">
          <Filter className="w-4 h-4" />
          <span>Filter</span>
        </div>
        <CustomSelect
          value={selectedProject}
          onChange={(val: string) => setSelectedProject(val)}
          options={[
            { value: "", label: "All Projects" },
            ...projects.map((p) => ({ value: p.project_id, label: p.projectInfo.name }))
          ]}
          className="flex-1 sm:flex-none min-w-[150px] w-full sm:w-48"
        />
        <CustomSelect
          value={selectedMember}
          onChange={(val: string) => setSelectedMember(val)}
          options={[
            { value: "", label: "All Members" },
            ...members.map((m) => ({ value: m.user.id, label: m.user.name || m.user.email }))
          ]}
          className="flex-1 sm:flex-none min-w-[150px] w-full sm:w-48"
        />
      </div>

      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground">
            No activity found for the selected filters.
          </div>
        ) : (
          logs.map((log) => {
            let actionText = log.action;
            if (log.action === "commented") {
              actionText = "commented on";
            } else if (log.action === "updated" && log.entityType === "task") {
              if (log.afterData?.status !== log.beforeData?.status) {
                actionText = `changed status to ${log.afterData?.status}`;
              } else if (log.afterData?.priority !== log.beforeData?.priority) {
                actionText = `changed priority to ${log.afterData?.priority}`;
              } else if (log.afterData?.columnId !== log.beforeData?.columnId) {
                actionText = `moved task to another column`;
              } else {
                actionText = "updated";
              }
            }

            let hoverTitle = `ID: ${log.entityId}`;
            if (log.action === "commented" && log.afterData?.content) {
              hoverTitle = `Comment: "${log.afterData.content}"\n${hoverTitle}`;
            } else if (log.action === "deleted a comment" && log.beforeData?.content) {
              hoverTitle = `Deleted Comment: "${log.beforeData.content}"\n${hoverTitle}`;
            } else if (log.action === "attached a file" && log.afterData?.filename) {
              hoverTitle = `File: ${log.afterData.filename}\n${hoverTitle}`;
            } else if (log.action === "deleted an attachment" && log.beforeData?.filename) {
              hoverTitle = `Deleted File: ${log.beforeData.filename}\n${hoverTitle}`;
            } else if (log.action === "updated" && log.entityType === "task") {
              if (log.afterData?.status !== log.beforeData?.status) {
                hoverTitle = `Status: ${log.beforeData?.status || 'none'} ➔ ${log.afterData?.status || 'none'}\n${hoverTitle}`;
              }
              if (log.afterData?.priority !== log.beforeData?.priority) {
                hoverTitle = `Priority: ${log.beforeData?.priority || 'none'} ➔ ${log.afterData?.priority || 'none'}\n${hoverTitle}`;
              }
            }

            return (
              <div 
                key={log.id} 
                onClick={() => log.entityType === "task" && setSelectedTaskId(log.entityId)}
                className={`flex gap-4 p-4 rounded-xl border bg-card text-card-foreground hover:shadow-md transition-shadow ${log.entityType === "task" ? "cursor-pointer hover:bg-muted/30" : ""}`}
                title={hoverTitle}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                  {log.actor?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="text-sm">
                    <span className="font-semibold text-foreground mr-1">{log.actor?.name || "System"}</span>
                    <span className="text-muted-foreground">{actionText}</span>
                    <span className="mx-1 text-foreground font-medium capitalize">{log.entityType}</span>
                    <span className="text-foreground font-semibold underline decoration-muted-foreground/30 underline-offset-2">
                      "{(log as any).entityTitle || log.entityId.substring(0, 8)}"
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    {formatDistanceToNowNative(log.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          workspaceId={workspaceId}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={() => handleRefresh()}
          onDeleted={() => {
            setSelectedTaskId(null);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}
