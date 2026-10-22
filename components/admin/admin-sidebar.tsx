"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  UserCheck,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
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
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { UserButton } from "@clerk/nextjs";

interface AdminSidebarProps {
  userEmail?: string;
  userName?: string;
}

export function AdminSidebar({ userEmail, userName }: AdminSidebarProps) {
  const pathname = usePathname();

  const mainNavItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      title: "Manage Reports",
      href: "/admin/reports",
      icon: ClipboardList,
      active: pathname.startsWith("/admin/reports"),
    },
    {
      title: "Incident Map",
      href: "/admin/map",
      icon: Compass,
      active: pathname.startsWith("/admin/map"),
    },
    {
      title: "Residents",
      href: "/admin/residents",
      icon: Users,
      active:
        pathname.startsWith("/admin/residents") ||
        pathname.startsWith("/admin/users"),
    },
    {
      title: "Assignments",
      href: "/admin/assignments",
      icon: UserCheck,
      active: pathname.startsWith("/admin/assignments"),
    },
    {
      title: "Reports/Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      active: pathname.startsWith("/admin/analytics"),
    },
    {
      title: "Notifications",
      href: "/admin/notifications",
      icon: Bell,
      active: pathname.startsWith("/admin/notifications"),
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
      active:
        pathname.startsWith("/admin/settings") ||
        pathname.startsWith("/admin/departments") ||
        pathname.startsWith("/admin/categories") ||
        pathname.startsWith("/admin/audit-logs"),
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border/70 bg-card">
      {/* Admin Sidebar Header */}
      <SidebarHeader className="border-b border-border/60 p-4">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <ShieldCheck className="size-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight text-foreground leading-none">
              Butuan Report
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 uppercase tracking-wider font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300/40 dark:border-blue-800/50"
              >
                Civic Admin
              </Badge>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      {/* Admin Navigation */}
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1 group-data-[collapsible=icon]:hidden">
            Administration
          </SidebarGroupLabel>
          <SidebarMenu>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={item.active}
                    tooltip={item.title}
                    className={
                      item.active
                        ? "bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:text-white shadow-xs"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground font-medium"
                    }
                  >
                    <Icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Admin Footer with Profile & Clerk User Menu */}
      <SidebarFooter className="border-t border-border/60 p-3">
        <div className="flex items-center justify-between gap-3 px-1 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="shrink-0">
              <UserButton />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-foreground truncate">
                {userName || "Administrator"}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {userEmail || "admin@butuan.gov.ph"}
              </span>
            </div>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
