import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getAdminDashboardStats } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/admin-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Tags, Users, ScrollText, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Master Settings & Governance | Butuan Report Admin",
  description: "Configure municipal response departments, hazard categories, user roles, and security audit logs",
};

export default async function AdminSettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const stats = await getAdminDashboardStats();

  const settingModules = [
    {
      title: "Municipal Departments",
      description: "Manage active response agencies, dispatch departments, and operational agency settings.",
      href: "/admin/departments",
      icon: Building2,
      countLabel: `${stats.activeDepartments} Active Agencies`,
      color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Hazard & Incident Categories",
      description: "Configure reporting categories, incident classifications, and public filing hazard options.",
      href: "/admin/categories",
      icon: Tags,
      countLabel: `${stats.activeCategories} Active Categories`,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "User Authorization & Access Roles",
      description: "Grant administrator, dispatcher, or responder privileges to municipal personnel.",
      href: "/admin/users",
      icon: Users,
      countLabel: `${stats.totalUsers} Registered Accounts`,
      color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Security & Audit Trail",
      description: "Immutable, append-only security logs for role modifications, report actions, and master updates.",
      href: "/admin/audit-logs",
      icon: ScrollText,
      countLabel: "Security Compliance",
      color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <>
      <AdminHeader
        title="Settings & System Governance"
        subtitle="Manage municipal agencies, reporting categories, role authorizations, and audit compliance"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settingModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link key={mod.title} href={mod.href} className="block group">
                <Card className="border-border/70 shadow-2xs group-hover:border-blue-500/50 group-hover:shadow-xs transition-all h-full flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className={`size-10 rounded-xl flex items-center justify-center ${mod.color}`}>
                        <Icon className="size-5" />
                      </div>
                      <span className="text-xs font-mono font-medium text-muted-foreground">
                        {mod.countLabel}
                      </span>
                    </div>
                    <CardTitle className="text-base font-bold text-foreground group-hover:text-blue-600 transition-colors pt-2 flex items-center justify-between">
                      <span>{mod.title}</span>
                      <ArrowRight className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      {mod.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
                      Configure Module &rarr;
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
