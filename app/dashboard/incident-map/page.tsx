import { Metadata } from "next";
import Link from "next/link";
import { Plus, Compass } from "lucide-react";
import { getMyIncidents } from "@/lib/data/incidents";
import { getActiveCategories } from "@/lib/data/categories";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ResidentIncidentMap } from "@/components/map/resident-incident-map";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Incident Map | Butuan Report",
  description: "Interactive geographic map of reported incidents across Butuan City",
};

export default async function IncidentMapPage() {
  const [incidents, categories] = await Promise.all([
    getMyIncidents(),
    getActiveCategories(),
  ]);

  return (
    <>
      <DashboardHeader
        title="Incident Map"
        subtitle="Geographic overview of your submitted incident reports across Butuan City"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Page Subheader */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Compass className="size-5 text-primary" />
              <span>Incident Spatial Overview</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Explore incident reports plotted by verified GPS coordinates. Click any pin for report details and status.
            </p>
          </div>

          <Link
            href="/dashboard/submit-report"
            className={cn(buttonVariants({ size: "sm" }), "rounded-full shadow-xs gap-1.5 self-start sm:self-center")}
          >
            <Plus className="size-4" />
            <span>Submit New Report</span>
          </Link>
        </div>

        {/* Interactive Resident Map with Filters */}
        <ResidentIncidentMap
          initialIncidents={incidents}
          categories={categories}
        />
      </main>
    </>
  );
}
