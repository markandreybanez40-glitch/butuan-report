"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import L from "leaflet";
import { ExternalLink, Compass, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IncidentDetailMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  barangay?: string;
  severity?: string;
  height?: string;
  viewOnMapHref?: string;
}

export function IncidentDetailMap({
  latitude,
  longitude,
  title,
  barangay,
  severity = "medium",
  height = "h-[220px] sm:h-[260px]",
  viewOnMapHref,
}: IncidentDetailMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: 16,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    let colorClass = "bg-primary text-primary-foreground ring-primary/40";
    if (severity === "critical") {
      colorClass = "bg-red-600 text-white ring-red-300 dark:ring-red-900";
    } else if (severity === "high") {
      colorClass = "bg-orange-500 text-white ring-orange-200 dark:ring-orange-900";
    } else if (severity === "medium") {
      colorClass = "bg-amber-500 text-white ring-amber-200 dark:ring-amber-900";
    } else if (severity === "low") {
      colorClass = "bg-blue-500 text-white ring-blue-200 dark:ring-blue-900";
    }

    const icon = L.divIcon({
      className: "incident-detail-marker",
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute size-8 rounded-full ${colorClass} opacity-30 animate-ping"></span>
          <div class="relative size-9 rounded-full ${colorClass} ring-4 ring-background flex items-center justify-center shadow-lg">
            <svg class="size-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });

    const marker = L.marker([latitude, longitude], { icon }).addTo(map);

    if (title || barangay) {
      marker.bindPopup(`
        <div class="p-1 font-sans text-xs">
          <strong>${title || "Incident Location"}</strong>
          ${barangay ? `<div class="text-[11px] text-muted-foreground mt-0.5">Barangay ${barangay}</div>` : ""}
          <div class="font-mono text-[10px] text-muted-foreground mt-1">${latitude.toFixed(6)}, ${longitude.toFixed(6)}</div>
        </div>
      `);
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [latitude, longitude, title, barangay, severity]);

  return (
    <div className="space-y-2">
      <div className={cn("relative w-full rounded-xl border border-border/80 overflow-hidden shadow-inner bg-muted", height)}>
        <div ref={mapContainerRef} className="w-full h-full z-10" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
          <Compass className="size-3.5 text-primary shrink-0" />
          <span>
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {viewOnMapHref && (
            <Link
              href={viewOnMapHref}
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "text-xs gap-1.5 h-7 px-2.5 font-medium shadow-2xs"
              )}
            >
              <MapPin className="size-3 text-primary" />
              <span>View on Map</span>
            </Link>
          )}

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs gap-1.5 h-7 px-2.5")}
          >
            <ExternalLink className="size-3" />
            <span>Google Maps</span>
          </a>
        </div>
      </div>
    </div>
  );
}
