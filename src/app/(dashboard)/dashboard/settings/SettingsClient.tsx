"use client";

import React, { useState, useEffect } from "react";
import { Tag, Trash2, Plus, Loader2 } from "lucide-react";
import { getWorkspaceLabels, createWorkspaceLabel } from "@/services/workspaceService";

export function SettingsClient({ workspaceId }: { workspaceId: string }) {
  const [labels, setLabels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      const data = await getWorkspaceLabels(workspaceId);
      setLabels(data || []);
    } catch (error) {
      console.error("Failed to fetch labels", error);
    }
    setLoading(false);
  };

  const createLabel = async () => {
    if (!newLabelName.trim()) return;
    setSaving(true);
    try {
      await createWorkspaceLabel(workspaceId, { 
        name: newLabelName, 
        color: newLabelColor 
      });
      setNewLabelName("");
      await fetchLabels();
    } catch (error) {
      console.error("Failed to create label", error);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      {/* Labels Section */}
      <div className="bg-card border rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6 text-lg font-semibold border-b pb-4">
          <Tag className="w-5 h-5 text-primary" />
          <h2>Custom Labels</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Create New Label</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Label Name (e.g. Bug, Feature)"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                className="w-full bg-muted/30 border rounded-lg px-4 py-2 outline-none focus:ring-2 ring-primary/50 text-sm"
              />
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="shrink-0 relative rounded-lg overflow-hidden border border-border shadow-sm w-12 h-12 sm:w-12 sm:h-10">
                  <input
                    type="color"
                    value={newLabelColor}
                    onChange={(e) => setNewLabelColor(e.target.value)}
                    className="absolute -inset-2 w-16 h-16 cursor-pointer border-none p-0 bg-transparent"
                  />
                </div>
                <button
                  onClick={createLabel}
                  disabled={saving || !newLabelName.trim()}
                  className="w-full bg-primary text-primary-foreground px-4 py-3 sm:py-2 rounded-xl sm:rounded-lg text-sm font-bold hover:bg-primary/90 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add Label</>}
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Existing Labels</h3>
            <div className="space-y-2">
              {labels.map(label => (
                <div key={label.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: label.color }}></div>
                    <span className="text-sm font-medium">{label.name}</span>
                  </div>
                  {/* Delete functionality to be added in future */}
                  <button className="text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {labels.length === 0 && <p className="text-sm text-muted-foreground italic">No custom labels created yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
