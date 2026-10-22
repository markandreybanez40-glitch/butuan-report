"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  ClipboardList,
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

interface StaffSidebarProps {
  userEmail?: string;
  userName?: string;
}

export function StaffSidebar({ userEmail, userName }: StaffSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Overview",
      href: "/staff",
      icon: LayoutDashboard,
      active: pathname === "/staff",
    },
    {
      title: "Assigned Reports",
      href: "/staff/incidents",
      icon: ClipboardList,
      active: pathname.startsWith("/staff/incidents"),
    },
    {
      title: "Notifications",
      href: "/staff/notifications",
      icon: Bell,
      active: pathname.startsWith("/staff/notifications"),
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border/80">
      {/* Sidebar Header */}
      <SidebarHeader className="border-b border-border/60 p-4">
        <Link href="/staff" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <ShieldAlert className="size-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight text-foreground leading-none">
              Responder Ops
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 uppercase tracking-wider font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300/40 dark:border-emerald-800/50"
              >
                Field Responder
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
                      ? "bg-emerald-600 text-white font-medium hover:bg-emerald-700 hover:text-white"
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

      {/* Footer User Info */}
      <SidebarFooter className="border-t border-border/60 p-3">
        <div className="flex items-center gap-3 px-1 group-data-[collapsible=icon]:hidden">
          <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-xs">
            <User className="size-4" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-foreground truncate">
              {userName || "Field Responder"}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {userEmail || "responder@butuan.gov.ph"}
            </span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
