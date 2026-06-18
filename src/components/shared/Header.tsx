"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Menu, LogOut } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { logout } from '@/services/authService';
import { NotificationBell } from './NotificationBell';
import { CommandMenu } from './CommandMenu';

export function Header({ workspaceId }: { workspaceId: string }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed", error);
    }
    router.push("/login");
    router.refresh();
  };



  return (
    <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 gap-4">
      <div className="flex items-center gap-3 sm:gap-4 flex-1">
        {/* Mobile menu button */}
        <button 
          className="lg:hidden p-2 text-muted-foreground hover:bg-muted rounded-md transition-colors"
          onClick={() => dispatch(toggleSidebar())}
          suppressHydrationWarning
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Global Search Trigger */}
        <div 
          className="relative w-full max-w-md group cursor-pointer"
          onClick={() => setIsCommandMenuOpen(true)}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <div className="w-full h-9 sm:h-10 pl-9 sm:pl-10 pr-4 rounded-full border border-border/50 bg-muted/40 group-hover:bg-muted/80 transition-all text-xs sm:text-sm shadow-sm flex items-center justify-between text-muted-foreground">
            <span>Search tasks, projects, members...</span>
            <div className="hidden sm:flex gap-1">
              <kbd className="text-[10px] bg-background/80 px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground font-mono shadow-sm">⌘</kbd>
              <kbd className="text-[10px] bg-background/80 px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground font-mono shadow-sm">K</kbd>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <NotificationBell workspaceId={workspaceId} />

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold transition-all shadow-sm border border-destructive/20 hover:border-destructive"
          suppressHydrationWarning
        >
          <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      <CommandMenu 
        workspaceId={workspaceId} 
        isOpen={isCommandMenuOpen} 
        setIsOpen={setIsCommandMenuOpen} 
      />
    </header>
  );
}
