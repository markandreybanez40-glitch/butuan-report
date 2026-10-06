"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  ClipboardList,
  Home,
  User,
  ArrowLeftRight,
  Bell,
  Compass,
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types";

interface StaffSidebarProps {
  userEmail?: string;
  userName?: string;
  userRole: UserRole;
}

export function StaffSidebar({ userEmail, userName, userRole }: StaffSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Overview",
      href: "/staff",
      icon: LayoutDashboard,
      active: pathname === "/staff",
    },
    {
      title: "Incident Queue",
      href: "/staff/incidents",
      icon: ClipboardList,
      active: pathname.startsWith("/staff/incidents"),
    },
    {
      title: "Incident Map",
      href: "/staff/map",
      icon: Compass,
      active: pathname.startsWith("/staff/map"),
    },
    {
      title: "Notifications",
      href: "/staff/notifications",
      icon: Bell,
      active: pathname.startsWith("/staff/notifications"),
    },
  ];

  const roleBadgeConfig = {
    dispatcher: {
      label: "Dispatcher",
      className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300/40 dark:border-amber-800/50",
    },
    responder: {
      label: "Field Responder",
      className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300/40 dark:border-emerald-800/50",
    },
    admin: {
      label: "System Admin",
      className: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300/40 dark:border-purple-800/50",
    },
    resident: {
      label: "Resident",
      className: "bg-muted text-muted-foreground",
    },
  }[userRole];

  return (
    <Sidebar collapsible="icon" className="border-r border-border/80">
      {/* Sidebar Header */}
      <SidebarHeader className="border-b border-border/60 p-4">
        <Link href="/staff" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <ShieldAlert className="size-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight text-foreground leading-none">
              Butuan Ops
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 uppercase tracking-wider font-semibold ${roleBadgeConfig.className}`}
              >
                {roleBadgeConfig.label}
              </Badge>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      {/* Navigation */}
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
                      ? "bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:text-primary-foreground"
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

        <SidebarSeparator className="my-4" />

        <SidebarMenu>
          {userRole === "admin" && (
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/admin" />}
                tooltip="Admin Command Center"
                className="text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-700"
              >
                <ShieldAlert className="size-4 text-purple-600" />
                <span>Admin Panel</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/dashboard" />}
              tooltip="Resident Portal"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftRight className="size-4" />
              <span>Resident View</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/" />}
              tooltip="Public Portal"
              className="text-muted-foreground hover:text-foreground"
            >
              <Home className="size-4" />
              <span>Public Site</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      {/* Footer User Info */}
      <SidebarFooter className="border-t border-border/60 p-3">
        <div className="flex items-center gap-3 px-1 group-data-[collapsible=icon]:hidden">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
            <User className="size-4" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-foreground truncate">
              {userName || "Staff Member"}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {userEmail || "staff@butuan.gov.ph"}
            </span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
