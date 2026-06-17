"use client";

import React, { useState } from "react";
import { X, Copy, Check, Loader2 } from "lucide-react";
import { createInvite } from "@/services/inviteService";

interface Props {
  workspaceId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteMemberModal({ workspaceId, onClose, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setError("");
      const invite = await createInvite(workspaceId, email.trim(), role);
      const link = `${window.location.origin}/invite/${invite.token}`;
      setInviteLink(link);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create invite");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-xl border shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold tracking-tight">Invite New Member</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          {!inviteLink ? (
            <form id="invite-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full bg-background border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <input
                  list="roles"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Developer, Designer, Member"
                  className="w-full bg-background border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/50"
                  required
                />
                <datalist id="roles">
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="guest">Guest</option>
                </datalist>
              </div>
            </form>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-green-500/10 text-green-600 border border-green-500/20 rounded-lg text-sm text-center font-medium">
                Invitation created successfully!
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Share this unique link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteLink}
                    className="flex-1 bg-muted/50 border rounded-lg px-3 py-2 text-sm text-muted-foreground outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shrink-0"
                    title="Copy Link"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                This link will expire in 7 days. It can only be used once.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-muted/20 flex justify-end gap-2">
          {!inviteLink ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="invite-form"
                disabled={!email.trim() || loading}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Generating..." : "Generate Link"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
