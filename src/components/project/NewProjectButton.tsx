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
        className="flex items-center gap-1.5 sm:gap-2 bg-primary text-primary-foreground px-3 sm:px-4 py-1.5 sm:py-2 rounded-md font-medium shadow-sm hover:bg-primary/90 transition whitespace-nowrap text-xs sm:text-sm"
      >
        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
