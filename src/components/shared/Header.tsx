"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, Menu, LogOut } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { toggleSidebar } from '@/store/slices/uiSlice';

export function Header() {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile menu button */}
        <button 
          className="md:hidden p-2 text-muted-foreground hover:bg-muted rounded-md transition-colors"
          onClick={() => dispatch(toggleSidebar())}
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Search Bar */}
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search tasks, projects, or people..." 
            className="w-full h-10 pl-10 pr-4 rounded-full border bg-muted/30 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
            <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded border text-muted-foreground font-mono">⌘</kbd>
            <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded border text-muted-foreground font-mono">K</kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-background"></span>
        </button>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
