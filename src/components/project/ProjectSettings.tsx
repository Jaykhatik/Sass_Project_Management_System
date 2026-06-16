"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Archive } from "lucide-react";

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
  "#6366F1", "#8B5CF6", "#EC4899", "#EF4444",
  "#F97316", "#EAB308", "#22C55E", "#14B8A6",
  "#3B82F6", "#06B6D4",
];

export function ProjectSettings({ project }: { project: Project }) {
  const [name, setName] = useState(project.projectInfo.name);
  const [description, setDescription] = useState(project.projectInfo.description ?? "");
  const [color, setColor] = useState(project.projectInfo.color ?? "#6366F1");
  const [loading, setLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/projects/${project.project_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: project.workspaceId,
          name: name.trim(),
          description: description.trim() || null,
          color,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update project");
      }

      setSuccess("Project settings saved.");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm("Archive this project? It will be hidden from the main list.")) return;
    setArchiving(true);
    try {
      await fetch(`/api/projects/${project.project_id}?workspaceId=${project.workspaceId}`, {
        method: "DELETE",
      });
      router.push("/dashboard/projects");
      router.refresh();
    } catch {
      setArchiving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-8">
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
                  boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : "none",
                }}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </form>

      {/* Danger Zone */}
      <div className="border border-destructive/30 rounded-xl p-5 space-y-3 bg-destructive/5">
        <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">
          Archiving this project will hide it from the project list. Tasks will not be deleted.
        </p>
        <button
          onClick={handleArchive}
          disabled={archiving}
          className="flex items-center gap-2 border border-destructive/40 text-destructive px-3 py-1.5 rounded-md text-sm font-medium hover:bg-destructive/10 transition-colors disabled:opacity-50"
        >
          {archiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
          Archive Project
        </button>
      </div>
    </div>
  );
}
