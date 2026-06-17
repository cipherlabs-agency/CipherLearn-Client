"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  type Notification,
} from "@/redux/slices/notifications/notificationsApi";
import { useNotificationStream } from "@/hooks/useNotificationStream";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TYPE_ICONS: Record<Notification["type"], typeof Info> = {
  INFO: Info,
  WARNING: AlertTriangle,
  SUCCESS: CheckCircle,
  ALERT: AlertCircle,
};

const TYPE_COLORS: Record<Notification["type"], string> = {
  INFO: "text-blue-500",
  WARNING: "text-amber-500",
  SUCCESS: "text-emerald-500",
  ALERT: "text-rose-500",
};

export function NotificationPanel() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // SSE stream — replaces 30s polling; updates RTK Query cache in real-time
  useNotificationStream();

  // Initial load (no pollingInterval — SSE handles live updates)
  const { data: notifications = [], isLoading } = useGetNotificationsQuery({ limit: 20 });
  const { data: unreadCount = 0 } = useGetUnreadCountQuery();
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) await markAsRead(notification.id);
    if (notification.link) router.push(notification.link);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button with live badge */}
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 rounded-lg hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px] text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground rounded-full leading-none animate-in zoom-in-50 duration-150">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[380px] max-h-[480px] rounded-xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">You&apos;re all caught up!</p>
                <p className="text-xs text-muted-foreground mt-1">No notifications at the moment.</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = TYPE_ICONS[notification.type];
                const iconColor = TYPE_COLORS[notification.type];
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full text-left flex gap-3 px-4 py-3 hover:bg-muted/40 transition-colors border-b border-border/30 last:border-0",
                      !notification.isRead && "bg-primary/[0.03]",
                    )}
                  >
                    <div className={cn("mt-0.5 shrink-0", iconColor)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-[13px] leading-tight truncate",
                            notification.isRead
                              ? "font-medium text-foreground/80"
                              : "font-semibold text-foreground",
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1 font-medium">
                        {timeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
