"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, ExternalLink, X } from "lucide-react";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, Notification } from "@/services/notificationService";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function NotificationBell({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const fetchNotifs = async () => {
      try {
        const data = await getNotifications(workspaceId);
        setNotifications(data);
      } catch (error) {
        console.error("Failed to load notifications", error);
      }
    };

    fetchNotifs();
    
    // Polling every 30 seconds
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [workspaceId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await markAsRead(workspaceId, id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Failed to mark as read");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteNotification(workspaceId, id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notification");
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      await markAllAsRead(workspaceId);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) {
      markAsRead(workspaceId, n.id).catch(console.error);
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
    }
    
    setIsOpen(false);
    
    // Navigate based on type
    if (n.type === "task_assigned" && n.data?.taskId) {
      router.push(`/dashboard/tasks?taskId=${n.data.taskId}`);
    } else if (n.type === "mention" && n.data?.taskId) {
      router.push(`/dashboard/tasks?taskId=${n.data.taskId}`);
    }
  };

  if (!workspaceId) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 sm:p-2.5 text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-border/50 rounded-full transition-all relative" 
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse shadow-sm"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[500px]">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                disabled={isLoading}
                className="text-xs text-indigo-500 hover:text-indigo-600 font-medium disabled:opacity-50"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex gap-3 p-3 rounded-lg cursor-pointer transition-colors group",
                    notification.isRead ? "hover:bg-muted/50" : "bg-indigo-500/5 hover:bg-indigo-500/10"
                  )}
                >
                  <div className="mt-0.5">
                    {!notification.isRead && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm", notification.isRead ? "text-foreground/80" : "font-semibold text-foreground")}>
                      {notification.title}
                    </p>
                    {notification.body && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.body}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.isRead ? (
                    <button 
                      onClick={(e) => handleMarkAsRead(e, notification.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-background rounded-md transition-all text-muted-foreground shrink-0 self-center"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => handleDelete(e, notification.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md transition-all text-muted-foreground shrink-0 self-center"
                      title="Delete notification"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="border-t p-2 bg-muted/20 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Activity Feed</p>
          </div>
        </div>
      )}
    </div>
  );
}
