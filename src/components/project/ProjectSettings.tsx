"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Archive } from "lucide-react";
import { updateProjectClient, archiveProjectClient } from "@/services/projectClientService";

interface Project {
  project_id: string;
  workspaceId: string;
  projectInfo: {
    name: string;
    description: string | null;
    status: string;
    color: string | null;
    icon: string | null;
    startDate: string | null;
    dueDate: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

const COLORS = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#14B8A6",
  "#3B82F6",
  "#06B6D4",
];

export function ProjectSettings({ project, isOwner }: { project: Project, isOwner?: boolean }) {
  const [name, setName] = useState(project.projectInfo.name);
  const [description, setDescription] = useState(
    project.projectInfo.description ?? "",
  );
  const [color, setColor] = useState(project.projectInfo.color ?? "#6366F1");
  const [loading, setLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await updateProjectClient(project.project_id, {
        workspaceId: project.workspaceId,
        name: name.trim(),
        description: description.trim() || null,
        color,
      });

      setSuccess("Project settings saved.");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to permanently delete this project? All tasks, boards, and columns will be instantly destroyed. This cannot be undone."))
      return;
    setArchiving(true);
    try {
      await archiveProjectClient(project.project_id, project.workspaceId);
      router.push("/dashboard/projects");
      router.refresh();
    } catch {
      setArchiving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-8 px-4 sm:px-0 mt-4 sm:mt-0 pb-10">
      <form onSubmit={handleSave} className="space-y-5">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 text-sm text-emerald-600 bg-emerald-50 rounded-md border border-emerald-200">
            {success}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Project Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background outline-none focus:ring-2 ring-primary/50 transition-shadow"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background outline-none focus:ring-2 ring-primary/50 transition-shadow resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Project Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  boxShadow:
                    color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : "none",
                }}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center sm:justify-start gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm w-full sm:w-auto"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </form>

      {/* Danger Zone */}
      {isOwner && (
        <div className="border border-destructive/30 rounded-xl p-5 space-y-3 bg-destructive/5">
          <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
          <p className="text-sm text-muted-foreground">
            Deleting this project will permanently erase all associated boards, columns, and tasks. This action cannot be undone.
          </p>
          <button
            onClick={handleArchive}
            disabled={archiving}
            className="flex items-center justify-center sm:justify-start gap-2 border border-destructive/40 text-destructive px-4 py-2 rounded-xl text-sm font-medium hover:bg-destructive/10 transition-colors disabled:opacity-50 w-full sm:w-auto mt-2"
          >
            {archiving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Archive className="w-4 h-4" />
            )}
            Delete Project Permanently
          </button>
        </div>
      )}
    </div>
  );
}
