"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { NewProjectDialog } from "@/components/project/NewProjectDialog";

export function NewProjectButton({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-sm hover:bg-primary/90 transition"
      >
        <Plus className="w-4 h-4" />
        New Project
      </button>

      {open && (
        <NewProjectDialog
          workspaceId={workspaceId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
