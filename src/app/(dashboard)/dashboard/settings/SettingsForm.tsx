"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { updateWorkspace } from "@/services/workspaceService";

export function SettingsForm({
  workspace,
}: {
  workspace: { id: string; name: string; slug: string };
}) {
  const [name, setName] = useState(workspace.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await updateWorkspace(workspace.id, { name });
      setSuccess("Settings saved successfully.");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
          {success}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Workspace Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-shadow bg-background"
          placeholder="e.g. Acme Corp"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Workspace Slug (URL)</label>
        <div className="flex">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
            app.example.com/
          </span>
          <input
            type="text"
            value={workspace.slug}
            disabled
            className="flex-1 block w-full border rounded-none rounded-r-md px-3 py-2 text-sm bg-muted/50 cursor-not-allowed"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          The slug cannot be changed after creation.
        </p>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading || name === workspace.name}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>
    </form>
  );
}
