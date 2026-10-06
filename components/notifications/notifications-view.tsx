"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  Loader2,
  AlertTriangle,
  Inbox,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationItem } from "./notification-item";
import {
  fetchNotificationsAction,
  fetchUnreadCountAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
} from "@/app/notifications/actions";
import type { Notification, UserRole } from "@/types";

interface NotificationsViewProps {
  role?: UserRole | "resident" | "staff" | "admin";
  title?: string;
  subtitle?: string;
}

export function NotificationsView({
  role = "resident",
  title = "Notification Center",
  subtitle = "Stay updated on report submissions, status updates, and operational activity.",
}: NotificationsViewProps) {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [count, items] = await Promise.all([
        fetchUnreadCountAction(),
        fetchNotificationsAction({ limit: 50, unreadOnly: filter === "unread" }),
      ]);
      setUnreadCount(count);
      setNotifications(items);
    } catch (err: unknown) {
      console.error("Error loading notifications view:", err);
      setError("Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    await markNotificationAsReadAction(id);
    if (filter === "unread") {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    setNotifications((prev) =>
      filter === "unread"
        ? []
        : prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
    setUnreadCount(0);

    await markAllNotificationsAsReadAction();
    setMarkingAll(false);
  };

  const handleDelete = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    if (target && !target.read_at) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    await deleteNotificationAction(id);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="font-semibold text-xs px-2.5 py-0.5">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="rounded-full shadow-2xs gap-1.5 self-start sm:self-auto text-xs"
          >
            {markingAll ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCheck className="size-3.5 text-primary" />
            )}
            <span>Mark all as read</span>
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="all" className="text-xs px-3 py-1.5 gap-1.5">
              <Inbox className="size-3.5" />
              <span>All</span>
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs px-3 py-1.5 gap-1.5">
              <Filter className="size-3.5" />
              <span>Unread Only</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
          <AlertTriangle className="size-8 text-destructive mx-auto" />
          <p className="text-sm font-medium text-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={loadData}>
            Retry Loading
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card p-12 text-center space-y-3">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Bell className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {filter === "unread"
              ? "You've read all your notifications! Check the 'All' tab to see past updates."
              : "When system activities or status updates occur regarding reports, notifications will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              role={role}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
