import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getStaffIncidentQueue } from "@/lib/data/staff";
import { getAdminCategories } from "@/lib/data/admin";
import { StaffMapView } from "@/components/staff/staff-map-view";
import { Compass } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Incident Map | Butuan Ops Center",
  description: "Municipal operations map for incident tracking, dispatching, and resolution.",
};

export default async function StaffMapPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "resident") {
    redirect("/dashboard");
  }

  const [incidents, categories] = await Promise.all([
    getStaffIncidentQueue(profile, { limit: 200 }),
    getAdminCategories(),
  ]);

  return (
    <div className="container mx-auto max-w-7xl py-6 px-4 sm:px-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 border-b border-border/60 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Compass className="size-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Municipal Incident Map
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Live spatial visualization of active emergency reports, hazards, and field responses across Butuan City.
        </p>
      </div>

      <StaffMapView incidents={incidents} categories={categories} userRole={profile.role as import("@/types").UserRole} />
    </div>
  );
}
