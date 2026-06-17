"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Building2, UserPlus } from "lucide-react";
import { getInviteDetails, acceptInvite } from "@/services/inviteService";

export function InviteClient({ token, isAuthenticated, userEmail }: { token: string, isAuthenticated: boolean, userEmail?: string }) {
  const router = useRouter();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await getInviteDetails(token);
        setDetails(data);
      } catch (err: any) {
        setError(err.message || "Invalid or expired invitation");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      router.push(`/signup?next=/invite/${token}`);
      return;
    }

    try {
      setAccepting(true);
      setError("");
      const res = await acceptInvite(token);
      if (res.success && res.workspaceId) {
        router.push(`/dashboard`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Failed to accept invitation");
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
        <div className="max-w-md w-full bg-card border rounded-2xl shadow-xl p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Invalid Invitation</h1>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full mt-6 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
      <div className="max-w-md w-full bg-card border rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Banner */}
        <div className="h-32 bg-gradient-to-br from-primary/80 to-purple-600/80 relative">
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <div className="w-20 h-20 bg-card rounded-2xl border-4 border-card flex items-center justify-center shadow-lg overflow-hidden">
              {details.workspace.logoUrl ? (
                <img src={details.workspace.logoUrl} alt="Workspace" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-8 h-8 text-primary" />
              )}
            </div>
          </div>
        </div>

        <div className="pt-14 pb-8 px-8 text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">You've been invited!</h1>
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{details.inviter.name || details.inviter.email}</span> has invited you to join <span className="font-semibold text-foreground">{details.workspace.name}</span>.
            </p>
          </div>

          <div className="p-4 bg-muted/50 rounded-xl border flex items-center justify-center gap-3 text-sm">
            <UserPlus className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">You will join as a</span>
            <span className="font-bold uppercase tracking-wider text-primary">{details.role}</span>
          </div>

          {isAuthenticated && userEmail && userEmail.toLowerCase() !== details.email.toLowerCase() ? (
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 font-medium">
                You are currently signed in as {userEmail}, but this invite is for {details.email}.
              </div>
              <button
                onClick={() => {
                  router.push("/login");
                }}
                className="w-full py-3 px-4 bg-muted text-foreground rounded-xl font-bold hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
              >
                Log out and Switch Account
              </button>
            </div>
          ) : (
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {accepting && <Loader2 className="w-5 h-5 animate-spin" />}
              {accepting 
                ? "Joining Workspace..." 
                : isAuthenticated 
                  ? "Accept Invitation" 
                  : "Create Account to Join"}
            </button>
          )}

          {!isAuthenticated ? (
            <p className="text-sm text-muted-foreground mt-4">
              Already have an account? <a href={`/login?next=/invite/${token}`} className="text-primary hover:underline font-medium">Log in instead</a>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-4">
              Signed in as {userEmail}. If this is not you, <a href="/login" className="underline">log out</a> and try again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
