"use client";

import dynamic from "next/dynamic";
import type { IncidentWithCategory } from "@/lib/data/incidents";

const IncidentsMap = dynamic(
  () => import("@/components/map/incidents-map").then((m) => m.IncidentsMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-2xl border border-border/80 bg-muted/40 animate-pulse flex items-center justify-center text-xs text-muted-foreground">
        Loading Interactive Incident Map...
      </div>
    ),
  }
);

interface ResidentMapViewProps {
  incidents: IncidentWithCategory[];
}

export function ResidentMapView({ incidents }: ResidentMapViewProps) {
  return <IncidentsMap incidents={incidents} role="resident" height="h-[520px]" />;
}
