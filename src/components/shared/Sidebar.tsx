"use client";

import React from "react";
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
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ workspaceSlug }: { workspaceSlug?: string }) {
  const displaySlug = workspaceSlug || "Workspace";
  const isSidebarOpen = useSelector((state: RootState) => state.ui.isSidebarOpen);
  const dispatch = useDispatch();
  const pathname = usePathname();

  const close = () => dispatch(setSidebarOpen(false));

  return (
    <>
      {/* ── Mobile Overlay — fades in/out smoothly ── */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-all duration-300 md:hidden",
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={close}
        aria-hidden="true"
      />

      {/* ── Sidebar Panel — slides in/out ── */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-50 h-screen w-72 md:w-64",
          "flex flex-col border-r bg-card",
          "transition-[transform,box-shadow] duration-300 ease-in-out",
          isSidebarOpen
            ? "translate-x-0 shadow-2xl shadow-black/30 md:shadow-none"
            : "-translate-x-full md:translate-x-0"
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
            className="md:hidden p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            onClick={close}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Nav Links ── */}
        <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-2">
            Navigation
          </p>
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
            <button className="w-full text-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm">
              Upgrade Plan ✨
            </button>
          </div>

          {/* User + Logout card */}
          <div className="rounded-xl border bg-muted/40 overflow-hidden">


            {/* Logout button */}
            <button
              onClick={() => {
                // Will wire up to real auth signOut() in Phase 14
                console.log("Logout clicked");
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 group"
            >
              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center group-hover:bg-destructive/15 transition-colors">
                <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
              </div>
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
