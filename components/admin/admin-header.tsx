"use client";

import { UserButton } from "@clerk/nextjs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Badge } from "@/components/ui/badge";

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AdminHeader({
  title = "Administrative Workspace",
  subtitle,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-foreground sm:text-base leading-none">
              {title}
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0.5 uppercase tracking-wider font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300/40 dark:border-blue-800/50 hidden sm:inline-flex"
            >
              City of Butuan
            </Badge>
          </div>
          {subtitle && (
            <p className="hidden sm:block text-xs text-muted-foreground mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <NotificationBell role="admin" />

        <ThemeToggle />

        <div className="flex items-center pl-1 border-l border-border/60">
          <UserButton />
        </div>
      </div>
    </header>
  );
}
