import { Metadata } from "next";
import Link from "next/link";
import { getMyIncidents } from "@/lib/data/incidents";
import { ResidentMapView } from "@/components/map/resident-map-view";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { MapPin, Plus, FileText, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Incident Map | Resident Portal",
  description: "Interactive map view of your reported incidents in Butuan City.",
};

export default async function ResidentMapPage() {
  const incidents = await getMyIncidents();
  const incidentsWithLocation = incidents.filter(
    (inc) => typeof inc.latitude === "number" && typeof inc.longitude === "number"
  );

  return (
    <div className="container mx-auto max-w-6xl py-6 px-4 sm:px-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Compass className="size-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              My Incident Map
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Visual map of your submitted incidents across Butuan City barangays.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/new"
            className={cn(buttonVariants({ size: "sm" }), "rounded-full shadow-2xs gap-1.5 text-xs")}
          >
            <Plus className="size-3.5" />
            <span>New Report</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-2xl border-border/70 p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">Total Incidents</p>
            <p className="text-xl font-bold text-foreground mt-0.5">{incidents.length}</p>
          </div>
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <FileText className="size-4" />
          </div>
        </Card>

        <Card className="rounded-2xl border-border/70 p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">Mapped on GPS</p>
            <p className="text-xl font-bold text-foreground mt-0.5">{incidentsWithLocation.length}</p>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <MapPin className="size-4" />
          </div>
        </Card>

        <Card className="rounded-2xl border-border/70 p-3.5 flex items-center justify-between col-span-2 sm:col-span-2">
          <div className="w-full">
            <p className="text-[11px] text-muted-foreground font-medium mb-1.5">Severity Pins Legend</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-500/10 text-red-700 dark:text-red-300 border-red-300/40">
                Critical
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-300/40">
                High
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/40">
                Medium
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/40">
                Low
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Map View */}
      <ResidentMapView incidents={incidents} />
    </div>
  );
}
