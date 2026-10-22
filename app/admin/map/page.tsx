import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getStaffIncidentQueue } from "@/lib/data/staff";
import { getAdminCategories } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/admin-header";
import { StaffMapView } from "@/components/staff/staff-map-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Incident Spatial Map | Butuan Report Admin",
  description: "Executive geographic incident monitoring and spatial triage across all Butuan City barangays.",
};

interface AdminMapPageProps {
  searchParams: Promise<{
    reportId?: string;
  }>;
}

export default async function AdminMapPage({ searchParams }: AdminMapPageProps) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const { reportId } = (await searchParams) || {};

  const [incidents, categories] = await Promise.all([
    getStaffIncidentQueue(profile, { limit: 500 }),
    getAdminCategories(),
  ]);

  return (
    <>
      <AdminHeader
        title="Incident Spatial Map"
        subtitle="Live geographic overview and geospatial analysis of citizen incident reports across Butuan City"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <StaffMapView
          incidents={incidents}
          categories={categories}
          userRole="admin"
          highlightIncidentId={reportId}
        />
      </main>
    </>
  );
}
