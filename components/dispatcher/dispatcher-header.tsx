"use client";

import { UserButton } from "@clerk/nextjs";
import { Radio } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface DispatcherHeaderProps {
  title: string;
  subtitle?: string;
}

export function DispatcherHeader({ title, subtitle }: DispatcherHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/70 bg-background/80 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Radio className="size-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground line-clamp-1">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground line-clamp-1 hidden md:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationBell />
        <ThemeToggle />
        <div className="pl-1 sm:pl-2 border-l border-border/60">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "size-8",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
