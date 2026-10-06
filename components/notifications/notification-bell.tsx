"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationItem } from "./notification-item";
import { fetchNotificationsAction, fetchUnreadCountAction, markNotificationAsReadAction, markAllNotificationsAsReadAction } from "@/app/notifications/actions";
import type { Notification, UserRole } from "@/types";

interface NotificationBellProps {
  role?: UserRole | "resident" | "staff" | "admin";
}

export function NotificationBell({ role = "resident" }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [count, items] = await Promise.all([
        fetchUnreadCountAction(),
        fetchNotificationsAction({ limit: 6 }),
      ]);
      setUnreadCount(count);
      setNotifications(items);
    } catch (err: unknown) {
      console.error("Error loading notifications in bell:", err);
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleMarkRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    await markNotificationAsReadAction(id);
    loadData();
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
    setUnreadCount(0);

    await markAllNotificationsAsReadAction();
    setMarkingAll(false);
    loadData();
  };

  const notificationPath =
    role === "admin"
      ? "/admin/notifications"
      : role === "staff" || role === "dispatcher" || role === "responder"
      ? "/staff/notifications"
      : "/dashboard/notifications";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="relative flex size-9 items-center justify-center rounded-full border border-border/70 bg-background hover:bg-accent text-foreground focus-visible:outline-none transition-colors"
        aria-label="Notifications"
      >
        <Bell className="size-4 text-foreground" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px] font-bold shadow-xs animate-in zoom-in"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 sm:w-96 p-0 rounded-2xl shadow-xl border-border/80 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0.5">
                {unreadCount} unread
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="h-7 text-xs text-primary hover:text-primary/90 hover:bg-primary/10 px-2 gap-1"
            >
              {markingAll ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <CheckCheck className="size-3.5" />
              )}
              <span>Mark all read</span>
            </Button>
          )}
        </div>

        {/* Content Body */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
          {loading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : error ? (
            <div className="p-6 text-center space-y-2">
              <AlertTriangle className="size-6 text-amber-500 mx-auto" />
              <p className="text-xs text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={loadData} className="text-xs h-7">
                Retry
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="size-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Bell className="size-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">No notifications yet</p>
              <p className="text-[11px] text-muted-foreground">
                You will be notified when report status or workflow updates occur.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                role={role}
                compact
                onMarkRead={handleMarkRead}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 bg-muted/20 p-2 text-center">
          <Link
            href={notificationPath}
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:text-primary/90 transition-colors py-1 w-full"
          >
            <span>View all notifications</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
