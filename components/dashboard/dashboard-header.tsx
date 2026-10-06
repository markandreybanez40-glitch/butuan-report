"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Plus, Compass } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
}

export function DashboardHeader({ title = "Resident Dashboard", subtitle }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-col">
          <h1 className="text-sm font-semibold tracking-tight text-foreground sm:text-base leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden sm:block text-xs text-muted-foreground mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <Link
          href="/dashboard/incident-map"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full shadow-2xs gap-1.5 hidden md:inline-flex text-xs")}
        >
          <Compass className="size-3.5" />
          <span>Incident Map</span>
        </Link>

        <Link
          href="/dashboard/submit-report"
          className={cn(buttonVariants({ size: "sm" }), "rounded-full shadow-xs gap-1.5 hidden sm:inline-flex text-xs")}
        >
          <Plus className="size-4" />
          <span>New Report</span>
        </Link>

        <NotificationBell role="resident" />

        <ThemeToggle />

        <div className="flex items-center ml-1">
          <UserButton />
        </div>
      </div>
    </header>
  );
}
