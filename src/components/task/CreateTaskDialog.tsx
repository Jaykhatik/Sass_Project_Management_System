"use client";

import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createTask } from "@/services/taskService";
import { Task } from "@/types";

const CustomSelect = ({
  value,
  onChange,
  options,
  className,
  disabled,
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

  const selectedOption =
    options.find((opt: any) => String(opt.value) === String(value)) || options[0];

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

interface Props {
  workspaceId: string;
  projectId: string;
  boardId: string;
  columnId: string;
  onClose: () => void;
  onCreated: (task: Task) => void;
}

export function CreateTaskDialog({ workspaceId, projectId, boardId, columnId, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const task = await createTask({
        workspaceId,
        projectId,
        boardId,
        columnId,
        title: title.trim(),
        priority,
      });
      onCreated(task);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4 sm:p-0">
      <div className="bg-background border border-border/50 rounded-2xl sm:rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b bg-muted/20 rounded-t-2xl sm:rounded-t-xl">
          <h2 className="text-lg font-semibold tracking-tight">Create New Task</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Task Title</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Fix navigation bug"
              className="w-full border rounded-md px-3 py-2 text-sm bg-background outline-none focus:ring-2 ring-primary/50 transition-shadow"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Priority</label>
            <CustomSelect
              value={priority}
              onChange={(val: string) => setPriority(val)}
              options={[
                { value: "none", label: "None" },
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
                { value: "critical", label: "Critical" },
              ]}
              className="w-full h-10"
            />
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-medium hover:bg-muted rounded-xl sm:rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 sm:py-2 rounded-xl sm:rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
