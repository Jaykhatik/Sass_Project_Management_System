"use client";

import React, { useState, useEffect } from "react";
import { Loader2, CreditCard, CheckCircle2, ShieldAlert } from "lucide-react";
import { useSearchParams } from "next/navigation";

export function BillingClient({ workspaceId, currentMembers, currentProjects }: { workspaceId: string, currentMembers: number, currentProjects: number }) {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [showCanceledBanner, setShowCanceledBanner] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchSubscription();

    if (searchParams.get("success") === "true") {
      setShowSuccessBanner(true);
      const timer = setTimeout(() => {
        setShowSuccessBanner(false);
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("success");
          window.history.replaceState({}, "", url.pathname);
        }
      }, 5000);

      const syncTimer = setTimeout(() => {
        fetchSubscription();
      }, 1500);

      return () => {
        clearTimeout(timer);
        clearTimeout(syncTimer);
      };
    }

    if (searchParams.get("canceled") === "true") {
      setShowCanceledBanner(true);
      const timer = setTimeout(() => {
        setShowCanceledBanner(false);
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("canceled");
          window.history.replaceState({}, "", url.pathname);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const dismissSuccess = () => {
    setShowSuccessBanner(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState({}, "", url.pathname);
    }
  };

  const dismissCanceled = () => {
    setShowCanceledBanner(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("canceled");
      window.history.replaceState({}, "", url.pathname);
    }
  };

  const fetchSubscription = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/billing`);
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription", error);
    }
    setLoading(false);
  };

  const handleUpgrade = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/billing/checkout`, { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error("Failed to checkout", error);
    }
    setActionLoading(false);
  };

  const handleManage = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/billing/portal`, { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error("Failed to open portal", error);
    }
    setActionLoading(false);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const isPro = subscription?.plan === "pro";
  const status = subscription?.status || "active";

  return (
    <div className="space-y-6">
      {showSuccessBanner && (
        <div className="bg-green-500/10 text-green-500 p-4 rounded-lg flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="font-medium text-sm">Subscription updated successfully! Thank you for going Pro.</p>
          </div>
          <button
            onClick={dismissSuccess}
            className="text-green-500 hover:text-green-700 p-1 rounded-md transition-colors"
            aria-label="Dismiss banner"
          >
            <span className="font-bold text-base leading-none">&times;</span>
          </button>
        </div>
      )}

      {showCanceledBanner && (
        <div className="bg-amber-500/10 text-amber-500 p-4 rounded-lg flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p className="font-medium text-sm">Checkout was canceled. You have not been charged.</p>
          </div>
          <button
            onClick={dismissCanceled}
            className="text-amber-500 hover:text-amber-700 p-1 rounded-md transition-colors"
            aria-label="Dismiss banner"
          >
            <span className="font-bold text-base leading-none">&times;</span>
          </button>
        </div>
      )}

      {/* Plan Details Card */}
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-muted/20">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Current Plan
          </h2>
        </div>
        <div className="p-6 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Your Plan</p>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-4xl font-extrabold capitalize ${isPro ? "text-indigo-500" : ""}`}>
                {subscription?.plan || "Free"}
              </span>
              {isPro && <span className="bg-indigo-500/10 text-indigo-500 text-xs px-3 py-1 rounded-full font-bold">ACTIVE</span>}
            </div>
            <p className="text-sm text-muted-foreground">
              {isPro 
                ? "You have unlimited access to all features." 
                : "You are currently on the free tier with restricted limits."}
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            {!isPro ? (
              <button 
                onClick={handleUpgrade}
                disabled={actionLoading}
                className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                {actionLoading ? "Loading..." : "Upgrade to Pro"}
              </button>
            ) : (
              <button 
                onClick={handleManage}
                disabled={actionLoading}
                className="bg-muted text-foreground font-medium px-6 py-3 rounded-xl border hover:bg-muted/80 transition disabled:opacity-50"
              >
                {actionLoading ? "Loading..." : "Manage Subscription"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Usage Meters */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-semibold text-lg">Team Members</h3>
              <p className="text-sm text-muted-foreground mt-1">Users in your workspace</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">{currentMembers}</span>
              <span className="text-muted-foreground"> / {isPro ? "Unlimited" : "5"}</span>
            </div>
          </div>
          
          {!isPro && (
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full rounded-full ${currentMembers >= 5 ? "bg-red-500" : "bg-primary"}`} 
                style={{ width: `${Math.min((currentMembers / 5) * 100, 100)}%` }}
              ></div>
            </div>
          )}
        </div>

        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-semibold text-lg">Projects</h3>
              <p className="text-sm text-muted-foreground mt-1">Active projects in workspace</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">{currentProjects}</span>
              <span className="text-muted-foreground"> / {isPro ? "Unlimited" : "3"}</span>
            </div>
          </div>
          
          {!isPro && (
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full rounded-full ${currentProjects >= 3 ? "bg-red-500" : "bg-primary"}`} 
                style={{ width: `${Math.min((currentProjects / 3) * 100, 100)}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
