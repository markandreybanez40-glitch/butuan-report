"use client";

import dynamic from "next/dynamic";

const IncidentDetailMap = dynamic(
  () => import("@/components/map/incident-detail-map").then((m) => m.IncidentDetailMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[220px] sm:h-[260px] rounded-xl border border-border/80 bg-muted/40 animate-pulse flex items-center justify-center text-xs text-muted-foreground">
        Loading Incident Location Map...
      </div>
    ),
  }
);

export interface IncidentDetailMapViewProps {
  latitude: number;
  longitude: number;
  title?: string;
  barangay?: string;
  severity?: string;
  height?: string;
  viewOnMapHref?: string;
}

export function IncidentDetailMapView(props: IncidentDetailMapViewProps) {
  return <IncidentDetailMap {...props} />;
}
