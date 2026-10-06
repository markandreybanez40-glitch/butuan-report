"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ScrollText, Users } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AdminHeader({
  title = "System Administration",
  subtitle,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight text-foreground sm:text-base leading-none">
              {title}
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 uppercase tracking-wider font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300/40 dark:border-purple-800/50 hidden sm:inline-flex"
            >
              Admin Panel
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
        <Link
          href="/admin/users"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-full shadow-xs gap-1.5 hidden md:inline-flex text-xs"
          )}
        >
          <Users className="size-3.5" />
          <span>Users</span>
        </Link>

        <Link
          href="/admin/audit-logs"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-full shadow-xs gap-1.5 hidden sm:inline-flex text-xs"
          )}
        >
          <ScrollText className="size-3.5" />
          <span>Audit Logs</span>
        </Link>

        <NotificationBell role="admin" />

        <ThemeToggle />

        <div className="flex items-center ml-1">
          <UserButton />
        </div>
      </div>
    </header>
  );
}
