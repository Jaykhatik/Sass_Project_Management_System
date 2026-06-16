"use client";

import React, { useState } from "react";
import { Shield, Trash2, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { WorkspaceMember } from "@/types";
import { updateMemberRole, deleteMember } from "@/services/workspaceService";

export function MemberList({
  initialMembers,
  workspaceId,
}: {
  initialMembers: WorkspaceMember[];
  workspaceId: string;
}) {
  const [members, setMembers] = useState<WorkspaceMember[]>(initialMembers);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoadingId(userId);
    try {
      const updated = await updateMemberRole(workspaceId, userId, newRole);
      setMembers(
        members.map((m) =>
          m.user.id === userId ? { ...m, role: updated.role } : m,
        ),
      );
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    setLoadingId(userId);
    try {
      await deleteMember(workspaceId, userId);
      setMembers(members.filter((m) => m.user.id !== userId));
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="divide-y divide-border">
      {members.map((member) => (
        <div
          key={member.membership_id}
          className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shrink-0 shadow-sm">
              {member.user.name
                ? member.user.name.charAt(0).toUpperCase()
                : member.user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-sm">
                {member.user.name || "Unknown User"}
              </p>
              <p className="text-xs text-muted-foreground">
                {member.user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                member.role === "owner"
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  : member.role === "admin"
                    ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                    : "bg-slate-500/10 text-slate-600 border-slate-500/20",
              )}
            >
              {member.role === "owner" && <Shield className="w-3 h-3" />}
              {member.role === "admin" && <Shield className="w-3 h-3" />}
              {member.role === "member" && <UserIcon className="w-3 h-3" />}
              <span className="capitalize">{member.role}</span>
            </div>

            {member.role !== "owner" && (
              <div className="flex items-center gap-2">
                <select
                  disabled={loadingId === member.user.id}
                  value={member.role}
                  onChange={(e) =>
                    handleRoleChange(member.user.id, e.target.value)
                  }
                  className="text-xs bg-background border rounded-md px-2 py-1.5 disabled:opacity-50 outline-none focus:ring-2 ring-primary/50"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="guest">Guest</option>
                </select>

                <button
                  onClick={() => handleRemove(member.user.id)}
                  disabled={loadingId === member.user.id}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
