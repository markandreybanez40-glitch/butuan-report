"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Incident, UserRole } from "@/types";

const DEFAULT_BUTUAN_CENTER: [number, number] = [8.9475, 125.5406];

export interface MapIncidentItem extends Incident {
  category?: {
    id?: string;
    name: string;
    description?: string | null;
  } | null;
}

interface IncidentsMapProps {
  incidents: MapIncidentItem[];
  role?: UserRole | "resident" | "staff" | "admin";
  height?: string;
}

export function IncidentsMap({
  incidents,
  role = "resident",
  height = "h-[500px]",
}: IncidentsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Filter incidents with valid GPS coordinates
  const validIncidents = incidents.filter(
    (inc) =>
      typeof inc.latitude === "number" &&
      typeof inc.longitude === "number" &&
      !isNaN(inc.latitude) &&
      !isNaN(inc.longitude) &&
      inc.latitude >= -90 &&
      inc.latitude <= 90 &&
      inc.longitude >= -180 &&
      inc.longitude <= 180
  );

  const createMarkerIcon = (severity: string, status: string) => {
    let colorClass = "bg-primary text-primary-foreground ring-primary/40";

    if (severity === "critical" || status === "rejected") {
      colorClass = "bg-red-600 text-white ring-red-300 dark:ring-red-900";
    } else if (severity === "high") {
      colorClass = "bg-orange-500 text-white ring-orange-200 dark:ring-orange-900";
    } else if (severity === "medium" || status === "in_progress") {
      colorClass = "bg-amber-500 text-white ring-amber-200 dark:ring-amber-900";
    } else if (status === "resolved" || status === "closed") {
      colorClass = "bg-emerald-600 text-white ring-emerald-300 dark:ring-emerald-900";
    } else if (severity === "low") {
      colorClass = "bg-blue-500 text-white ring-blue-200 dark:ring-blue-900";
    }

    return L.divIcon({
      className: "incident-leaflet-marker",
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute size-7 rounded-full ${colorClass} opacity-30 animate-ping"></span>
          <div class="relative size-8 rounded-full ${colorClass} ring-4 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform cursor-pointer">
            <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_BUTUAN_CENTER,
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersGroupRef.current = null;
    };
  }, []);

  // Update Markers on incidents change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    const bounds: L.LatLngBounds = L.latLngBounds([]);

    validIncidents.forEach((inc) => {
      const lat = inc.latitude!;
      const lng = inc.longitude!;
      const latLng: [number, number] = [lat, lng];
      bounds.extend(latLng);

      const targetPath =
        role === "staff" || role === "dispatcher" || role === "responder" || role === "admin"
          ? `/staff/incidents/${inc.id}`
          : `/dashboard/reports/${inc.id}`;

      const formattedDate = new Date(inc.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const popupContent = document.createElement("div");
      popupContent.className = "p-1 font-sans text-foreground max-w-xs";
      popupContent.innerHTML = `
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2 border-b border-border/60 pb-1.5">
            <span class="font-mono text-xs font-bold text-primary">${inc.report_number}</span>
            <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-border bg-muted">
              ${inc.severity}
            </span>
          </div>

          <div>
            <h4 class="font-bold text-sm leading-tight text-foreground">${inc.title}</h4>
            <p class="text-xs text-muted-foreground mt-0.5">
              ${inc.category?.name || "General Incident"} &bull; Barangay ${inc.barangay}
            </p>
          </div>

          <div class="text-[11px] text-muted-foreground flex justify-between items-center pt-1">
            <span>Status: <strong class="uppercase font-semibold text-foreground">${inc.status.replace("_", " ")}</strong></span>
            <span>${formattedDate}</span>
          </div>

          <div class="pt-2 border-t border-border/60">
            <a href="${targetPath}" class="inline-flex items-center justify-center w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors text-center text-white text-decoration-none">
              View Details &rarr;
            </a>
          </div>
        </div>
      `;

      const marker = L.marker(latLng, {
        icon: createMarkerIcon(inc.severity, inc.status),
      }).bindPopup(popupContent);

      markersGroupRef.current?.addLayer(marker);
    });

    if (validIncidents.length > 0 && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(DEFAULT_BUTUAN_CENTER, 13);
    }
  }, [validIncidents, role]);

  return (
    <div className="relative w-full rounded-2xl border border-border/80 shadow-md overflow-hidden bg-card">
      <div ref={mapContainerRef} className={`w-full ${height} z-10`} />

      {validIncidents.length === 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-xs p-6 text-center">
          <div className="max-w-sm p-4 rounded-2xl bg-card border border-border shadow-lg space-y-1">
            <p className="text-sm font-semibold text-foreground">No Geolocation Pins Found</p>
            <p className="text-xs text-muted-foreground">
              None of the selected incidents have GPS coordinates. Add coordinates to incident reports to view them on the map.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
