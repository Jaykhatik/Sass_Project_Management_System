"use client";

import React, { useEffect } from "react";
import axios from "axios";
import { refreshSession } from "@/services/authService";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  Settings,
  X,
  LogOut,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setSidebarOpen } from "@/store/slices/uiSlice";

const navLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { name: "Members", href: "/dashboard/members", icon: Users },
  { name: "Activity Feed", href: "/dashboard/activity", icon: LayoutDashboard },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ workspaceSlug }: { workspaceSlug?: string }) {
  const displaySlug = workspaceSlug || "Workspace";
  const isSidebarOpen = useSelector((state: RootState) => state.ui.isSidebarOpen);
  const dispatch = useDispatch();
  const pathname = usePathname();

  const close = () => dispatch(setSidebarOpen(false));

  // Option B: Silent Token Refresh Polling
  // Pings the backend every 12 minutes to keep the 15-minute access token alive
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await refreshSession();
        console.log("Session silently refreshed.");
      } catch (error) {
        console.error("Failed to refresh session.");
      }
    }, 12 * 60 * 1000); // 12 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* ── Mobile Overlay — fades in/out smoothly ── */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/60 backdrop-blur-md transition-all duration-300 lg:hidden",
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={close}
        aria-hidden="true"
      />

      {/* ── Sidebar Panel — slides in/out ── */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-72 lg:w-64",
          "flex flex-col border-r bg-background/95 lg:bg-card backdrop-blur-2xl",
          "transition-[transform,box-shadow] duration-300 ease-in-out",
          isSidebarOpen
            ? "translate-x-0 shadow-[4px_0_24px_rgba(0,0,0,0.1)] border-r-white/10 lg:shadow-none"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* ── Logo / Workspace Header ── */}
        <div className="flex items-center justify-between h-16 px-5 border-b shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              {displaySlug.charAt(0).toUpperCase()}
            </div>
            <div className="leading-tight">
              <p className="font-semibold text-sm truncate max-w-[140px]">{displaySlug}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Workspace</p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            suppressHydrationWarning
            className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            onClick={close}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Nav Links ── */}
        <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/dashboard"
                ? pathname === link.href
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={close}
                className={cn(
                  "group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  {link.name}
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom Section ── */}
        <div className="px-3 pb-4 pt-3 border-t shrink-0 space-y-2">
          {/* Upgrade card */}
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4">
            <h4 className="text-sm font-semibold mb-1">Upgrade to Pro</h4>
            <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
              Unlock unlimited projects, advanced analytics, and priority support.
            </p>
            <button suppressHydrationWarning className="w-full text-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm">
              Upgrade Plan ✨
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
