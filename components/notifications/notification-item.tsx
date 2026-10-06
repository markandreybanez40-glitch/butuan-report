"use client";

import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  UserCheck,
  Archive,
  Bell,
  Trash2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Notification, UserRole } from "@/types";

interface NotificationItemProps {
  notification: Notification;
  role?: UserRole | "resident" | "staff" | "admin";
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function NotificationItem({
  notification,
  role = "resident",
  onMarkRead,
  onDelete,
  compact = false,
}: NotificationItemProps) {
  const isUnread = !notification.read_at;

  // Compute link based on role and related incident
  const getTargetHref = () => {
    if (!notification.related_incident_id) return "#";
    if (role === "admin") {
      return `/admin/reports/${notification.related_incident_id}`;
    }
    if (role === "staff") {
      return `/staff/incidents/${notification.related_incident_id}`;
    }
    return `/dashboard/reports/${notification.related_incident_id}`;
  };

  const href = getTargetHref();

  const getIcon = () => {
    switch (notification.type) {
      case "report_submitted":
      case "new_incident":
        return <AlertCircle className="size-4 text-blue-500 shrink-0" />;
      case "status_changed":
      case "workflow_changed":
        return <Clock className="size-4 text-amber-500 shrink-0" />;
      case "report_assigned":
      case "incident_assigned_staff":
        return <UserCheck className="size-4 text-purple-500 shrink-0" />;
      case "public_update":
      case "incident_updated":
        return <MessageSquare className="size-4 text-cyan-500 shrink-0" />;
      case "report_resolved":
        return <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />;
      case "report_closed":
        return <Archive className="size-4 text-slate-500 shrink-0" />;
      default:
        return <Bell className="size-4 text-primary shrink-0" />;
    }
  };

  const formattedDate = new Date(notification.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "group relative flex items-start justify-between gap-3 transition-colors border-b border-border/50 last:border-0",
        compact ? "p-3" : "p-4 sm:p-5 rounded-xl border border-border/70 mb-2 shadow-2xs",
        isUnread
          ? "bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/15"
          : "bg-card hover:bg-muted/50"
      )}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Unread indicator dot */}
        <div className="flex items-center pt-0.5">
          {isUnread ? (
            <span className="size-2 rounded-full bg-primary ring-2 ring-primary/20 shrink-0" />
          ) : (
            <span className="size-2 rounded-full bg-transparent shrink-0" />
          )}
        </div>

        {/* Icon */}
        <div className="mt-0.5 p-1.5 rounded-lg bg-background border border-border/60 shadow-2xs">
          {getIcon()}
        </div>

        {/* Text Content */}
        <div className="flex flex-col min-w-0 flex-1">
          {href !== "#" ? (
            <Link
              href={href}
              onClick={() => isUnread && onMarkRead?.(notification.id)}
              className="text-xs sm:text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
            >
              {notification.title}
            </Link>
          ) : (
            <span className="text-xs sm:text-sm font-semibold text-foreground line-clamp-1">
              {notification.title}
            </span>
          )}

          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
            {notification.message}
          </p>

          <span className="text-[10px] text-muted-foreground/80 mt-1.5 font-medium">
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
        {isUnread && onMarkRead && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMarkRead(notification.id)}
            title="Mark as read"
            className="size-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            <Check className="size-3.5" />
            <span className="sr-only">Mark as read</span>
          </Button>
        )}

        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(notification.id)}
            title="Delete notification"
            className="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
            <span className="sr-only">Delete</span>
          </Button>
        )}
      </div>
    </div>
  );
}
