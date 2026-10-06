"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ListFilter, Compass } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface StaffHeaderProps {
  title?: string;
  subtitle?: string;
  role?: UserRole;
}

export function StaffHeader({
  title = "Operations Center",
  subtitle,
  role = "dispatcher",
}: StaffHeaderProps) {
  const roleBadgeConfig = {
    dispatcher: {
      label: "Dispatcher",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/40 dark:border-amber-800/50",
    },
    responder: {
      label: "Responder",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/40 dark:border-emerald-800/50",
    },
    admin: {
      label: "Admin",
      className: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300/40 dark:border-purple-800/50",
    },
    resident: {
      label: "Resident",
      className: "bg-muted text-muted-foreground",
    },
  }[role];

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
              className={`text-[10px] px-1.5 py-0 uppercase tracking-wider font-semibold hidden sm:inline-flex ${roleBadgeConfig.className}`}
            >
              {roleBadgeConfig.label}
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
          href="/staff/map"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-full shadow-2xs gap-1.5 hidden md:inline-flex text-xs"
          )}
        >
          <Compass className="size-3.5" />
          <span>Incident Map</span>
        </Link>

        <Link
          href="/staff/incidents"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-full shadow-xs gap-1.5 hidden sm:inline-flex text-xs"
          )}
        >
          <ListFilter className="size-3.5" />
          <span>Incident Queue</span>
        </Link>

        <NotificationBell role={role} />

        <ThemeToggle />

        <div className="flex items-center ml-1">
          <UserButton />
        </div>
      </div>
    </header>
  );
}
