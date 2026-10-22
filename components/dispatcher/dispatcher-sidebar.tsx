"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Radio,
  LayoutDashboard,
  ClipboardList,
  UserCheck,
  Bell,
  User,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

interface DispatcherSidebarProps {
  userEmail?: string;
  userName?: string;
}

export function DispatcherSidebar({ userEmail, userName }: DispatcherSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Overview",
      href: "/dispatcher",
      icon: LayoutDashboard,
      active: pathname === "/dispatcher",
    },
    {
      title: "Reports",
      href: "/dispatcher/reports",
      icon: ClipboardList,
      active: pathname.startsWith("/dispatcher/reports"),
    },
    {
      title: "Assignments",
      href: "/dispatcher/assignments",
      icon: UserCheck,
      active: pathname.startsWith("/dispatcher/assignments"),
    },
    {
      title: "Notifications",
      href: "/dispatcher/notifications",
      icon: Bell,
      active: pathname.startsWith("/dispatcher/notifications"),
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border/80">
      {/* Dispatcher Sidebar Header */}
      <SidebarHeader className="border-b border-border/60 p-4">
        <Link href="/dispatcher" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
            <Radio className="size-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight text-foreground leading-none">
              Butuan Dispatch
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 uppercase tracking-wider font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300/40 dark:border-amber-800/50"
              >
                City Dispatcher
              </Badge>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      {/* Dispatcher Navigation */}
      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={item.active}
                  tooltip={item.title}
                  className={
                    item.active
                      ? "bg-amber-500 text-white font-medium hover:bg-amber-600 hover:text-white"
                      : ""
                  }
                >
                  <Icon className="size-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Dispatcher Footer */}
      <SidebarFooter className="border-t border-border/60 p-3">
        <div className="flex items-center gap-3 px-1 group-data-[collapsible=icon]:hidden">
          <div className="flex size-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs">
            <User className="size-4" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-foreground truncate">
              {userName || "City Dispatcher"}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {userEmail || "dispatcher@butuan.gov.ph"}
            </span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
