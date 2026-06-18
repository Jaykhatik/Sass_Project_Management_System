"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, FileText, FolderGit2, User, ChevronRight } from "lucide-react";
import { globalSearch, SearchResults } from "@/services/searchService";
import { useDebounce } from "@/hooks/useDebounce";

interface CommandMenuProps {
  workspaceId: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function CommandMenu({ workspaceId, isOpen, setIsOpen }: CommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setIsOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery("");
      setResults(null);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Fetch results
  useEffect(() => {
    if (!isOpen) return;

    if (debouncedQuery.trim().length === 0) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const data = await globalSearch(workspaceId, debouncedQuery);
        setResults(data);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery, workspaceId, isOpen]);

  // Flatten results for keyboard navigation
  const flatItems = React.useMemo(() => {
    if (!results) return [];
    return [
      ...results.tasks.map(t => ({ ...t, type: 'task' as const })),
      ...results.projects.map(p => ({ ...p, type: 'project' as const })),
      ...results.members.map(m => ({ ...m, type: 'member' as const })),
    ];
  }, [results]);

  // Arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev < flatItems.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter" && flatItems.length > 0) {
        e.preventDefault();
        handleSelect(flatItems[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flatItems, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (scrollRef.current && isOpen && flatItems.length > 0) {
      const activeElement = scrollRef.current.querySelector('[data-active="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, isOpen, flatItems.length]);

  const handleSelect = (item: any) => {
    setIsOpen(false);
    if (item.type === "task") {
      router.push(`/dashboard/tasks?taskId=${item.id}`);
    } else if (item.type === "project") {
      router.push(`/dashboard/projects/${item.id}/board`);
    } else if (item.type === "member") {
      router.push(`/dashboard/members`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4 animate-in fade-in duration-200">
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      
      <div className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-3 border-b border-border/50 bg-muted/20">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none px-3 py-1 text-lg placeholder:text-muted-foreground/60 focus:ring-0"
            placeholder="Search tasks, projects, members..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isLoading && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin shrink-0" />}
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-muted px-2 py-1 rounded text-muted-foreground font-mono font-medium ml-2">
            ESC
          </kbd>
        </div>

        <div 
          ref={scrollRef}
          className="max-h-[60vh] overflow-y-auto"
        >
          {query.trim().length > 0 && !isLoading && flatItems.length === 0 && (
            <div className="py-14 text-center text-muted-foreground">
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          )}

          {query.trim().length === 0 && (
            <div className="py-8 px-4 text-center text-muted-foreground/60 flex flex-col items-center gap-2">
              <Search className="w-8 h-8 opacity-20" />
              <p className="text-sm">Type anything to search the workspace</p>
            </div>
          )}

          {results && flatItems.length > 0 && (
            <div className="py-2">
              {results.tasks.length > 0 && (
                <div className="mb-4 px-2">
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Tasks
                  </div>
                  {results.tasks.map((task) => {
                    const idx = flatItems.findIndex(i => i.id === task.id);
                    const isActive = idx === selectedIndex;
                    return (
                      <div
                        key={task.id}
                        data-active={isActive}
                        onClick={() => handleSelect({ ...task, type: 'task' })}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mx-2 cursor-pointer transition-colors ${
                          isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                      >
                        <FileText className={`w-4 h-4 ${isActive ? "text-primary-foreground/80" : "text-indigo-500"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          {task.project && (
                            <p className={`text-xs truncate ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {task.project.name}
                            </p>
                          )}
                        </div>
                        {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {results.projects.length > 0 && (
                <div className="mb-4 px-2">
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Projects
                  </div>
                  {results.projects.map((project) => {
                    const idx = flatItems.findIndex(i => i.id === project.id);
                    const isActive = idx === selectedIndex;
                    return (
                      <div
                        key={project.id}
                        data-active={isActive}
                        onClick={() => handleSelect({ ...project, type: 'project' })}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mx-2 cursor-pointer transition-colors ${
                          isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                      >
                        <FolderGit2 className={`w-4 h-4 ${isActive ? "text-primary-foreground/80" : "text-emerald-500"}`} />
                        <span className="flex-1 text-sm font-medium truncate">{project.name}</span>
                        {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {results.members.length > 0 && (
                <div className="mb-2 px-2">
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Members
                  </div>
                  {results.members.map((member) => {
                    const idx = flatItems.findIndex(i => i.id === member.id);
                    const isActive = idx === selectedIndex;
                    return (
                      <div
                        key={member.id}
                        data-active={isActive}
                        onClick={() => handleSelect({ ...member, type: 'member' })}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mx-2 cursor-pointer transition-colors ${
                          isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                      >
                        {member.user.avatarUrl ? (
                          <img src={member.user.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
                        ) : (
                          <User className={`w-4 h-4 ${isActive ? "text-primary-foreground/80" : "text-orange-500"}`} />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">{member.user.name || member.user.email}</span>
                        </div>
                        {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
