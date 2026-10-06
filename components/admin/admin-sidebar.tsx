"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  Tags,
  ScrollText,
  ArrowLeftRight,
  Home,
  User,
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

interface AdminSidebarProps {
  userEmail?: string;
  userName?: string;
}

export function AdminSidebar({ userEmail, userName }: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Incident Reports",
      href: "/admin/reports",
      icon: FileText,
      active: pathname.startsWith("/admin/reports"),
    },
    {
      title: "Overview",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
      active: pathname.startsWith("/admin/users"),
    },
    {
      title: "Departments",
      href: "/admin/departments",
      icon: Building2,
      active: pathname.startsWith("/admin/departments"),
    },
    {
      title: "Categories",
      href: "/admin/categories",
      icon: Tags,
      active: pathname.startsWith("/admin/categories"),
    },
    {
      title: "Audit Logs",
      href: "/admin/audit-logs",
      icon: ScrollText,
      active: pathname.startsWith("/admin/audit-logs"),
    },
    {
      title: "Incident Map",
      href: "/staff/map",
      icon: Compass,
      active: pathname.startsWith("/staff/map"),
    },
    {
      title: "Notifications",
      href: "/admin/notifications",
      icon: Bell,
      active: pathname.startsWith("/admin/notifications"),
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border/80">
      {/* Sidebar Header */}
      <SidebarHeader className="border-b border-border/60 p-4">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
            <ShieldAlert className="size-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight text-foreground leading-none">
              Butuan Admin
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 uppercase tracking-wider font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300/40 dark:border-purple-800/50"
              >
                Super Admin
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
                      ? "bg-purple-600 text-white font-medium hover:bg-purple-700 hover:text-white"
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
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/staff" />}
              tooltip="Staff Operations"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftRight className="size-4 text-amber-500" />
              <span>Staff Operations</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

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
          <div className="flex size-8 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 font-bold text-xs">
            <User className="size-4" />
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
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
