"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  LayoutDashboard,
  FileText,
  PlusCircle,
  Home,
  User,
  ShieldAlert,
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

interface ResidentSidebarProps {
  userEmail?: string;
  userName?: string;
  userRole?: string;
}

export function ResidentSidebar({ userEmail, userName, userRole }: ResidentSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      title: "My Reports",
      href: "/dashboard/my-reports",
      icon: FileText,
      active: pathname.startsWith("/dashboard/my-reports") || pathname.startsWith("/dashboard/reports"),
    },
    {
      title: "Submit Report",
      href: "/dashboard/submit-report",
      icon: PlusCircle,
      active: pathname === "/dashboard/submit-report" || pathname === "/dashboard/new",
    },
    {
      title: "Incident Map",
      href: "/dashboard/map",
      icon: Compass,
      active: pathname.startsWith("/dashboard/map"),
    },
    {
      title: "Notifications",
      href: "/dashboard/notifications",
      icon: Bell,
      active: pathname.startsWith("/dashboard/notifications"),
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border/80">
      {/* Sidebar Header */}
      <SidebarHeader className="border-b border-border/60 p-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <ShieldCheck className="size-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight text-foreground leading-none">
              Butuan Report
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase tracking-wider font-semibold">
                Resident
              </Badge>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      {/* Sidebar Navigation */}
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
                  className={item.active ? "bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:text-primary-foreground" : ""}
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

          {userRole && userRole !== "resident" && (
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/staff" />}
                tooltip="Staff Operations"
                className="text-amber-600 dark:text-amber-400 font-semibold hover:text-amber-700"
              >
                <ShieldAlert className="size-4 text-amber-500" />
                <span>Staff Operations</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/" />}
              tooltip="Public Portal"
              className="text-muted-foreground hover:text-foreground"
            >
              <Home className="size-4" />
              <span>Return to Home</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter className="border-t border-border/60 p-3">
        <div className="flex items-center gap-3 px-1 group-data-[collapsible=icon]:hidden">
          <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <User className="size-4" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-foreground truncate">
              {userName || "Resident"}
            </span>
            <span className="text-[11px] text-muted-foreground truncate">
              {userEmail || "citizen@butuan.gov.ph"}
            </span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
