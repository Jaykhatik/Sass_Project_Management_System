"use client";

import React, { useState } from "react";
import { Shield, Trash2, User as UserIcon, Plus, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { WorkspaceMember } from "@/types";
import { updateMemberRole, deleteMember } from "@/services/workspaceService";
import { revokeInvite } from "@/services/inviteService";
import { InviteMemberModal } from "@/components/workspace/InviteMemberModal";

export function MemberList({
  initialMembers,
  initialInvites,
  workspaceId,
  currentUserId,
}: {
  initialMembers: WorkspaceMember[];
  initialInvites?: any[];
  workspaceId: string;
  currentUserId: string;
}) {
  const [members, setMembers] = useState<WorkspaceMember[]>(initialMembers);
  const [invites, setInvites] = useState<any[]>(initialInvites || []);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const router = useRouter();

  const currentUser = members.find(m => m.user.id === currentUserId);
  const isPrivileged = currentUser?.role === 'owner';

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

  const handleRevoke = async (inviteId: string) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) return;
    setLoadingId(inviteId);
    try {
      await revokeInvite(workspaceId, inviteId);
      setInvites(invites.filter((i) => i.id !== inviteId));
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {isPrivileged && (
        <div className="flex justify-center sm:justify-end mb-4">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="w-full sm:w-auto justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Invite Member
          </button>
        </div>
      )}

      <div className="border rounded-xl bg-card shadow-sm overflow-hidden divide-y divide-border">
        {/* Workspace Members Section */}
        <div className="bg-muted/30 px-4 py-2 border-b">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Members</h3>
        </div>
        <div className="divide-y divide-border">
      {members.map((member) => (
        <div
          key={member.membership_id}
          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-3 sm:gap-0"
        >
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shrink-0 shadow-sm">
              {member.user.name
                ? member.user.name.charAt(0).toUpperCase()
                : member.user.email.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">
                {member.user.name || "Unknown User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {member.user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-1 sm:mt-0 pl-14 sm:pl-0">
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

            <div className="flex items-center gap-2">
              {isPrivileged && member.role !== "owner" && member.user.id !== currentUserId && (
                <button
                  onClick={() => handleRemove(member.user.id)}
                  disabled={loadingId === member.user.id}
                  className="text-xs text-destructive hover:text-destructive/80 font-medium flex items-center gap-1 disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      </div>
      </div>

      {/* Pending Invites Section */}
      {invites.length > 0 && (
        <div className="border rounded-xl bg-card shadow-sm overflow-hidden divide-y divide-border mt-6">
          <div className="bg-muted/30 px-4 py-2 border-b">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Invitations</h3>
          </div>
          <div className="divide-y divide-border">
            {invites.map((invite) => (
              <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-3 sm:gap-0">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 shadow-sm">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-muted-foreground truncate">{invite.email}</p>
                    <p className="text-xs text-muted-foreground/70 truncate">
                      Invited by {invite.inviter.name || invite.inviter.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-1 sm:mt-0 pl-14 sm:pl-0">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-muted/50 text-muted-foreground">
                    <span className="capitalize">{invite.role}</span>
                  </div>
                  {isPrivileged && (
                    <button
                      onClick={() => handleRevoke(invite.id)}
                      disabled={loadingId === invite.id}
                      className="text-xs text-destructive hover:text-destructive/80 font-medium flex items-center gap-1 disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isInviteModalOpen && (
        <InviteMemberModal
          workspaceId={workspaceId}
          onClose={() => setIsInviteModalOpen(false)}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
