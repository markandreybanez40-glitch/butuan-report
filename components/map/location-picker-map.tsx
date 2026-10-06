"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { Navigation, MapPin, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DEFAULT_BUTUAN_CENTER: [number, number] = [8.9475, 125.5406];

interface LocationPickerMapProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (coords: { lat: number; lng: number }) => void;
  disabled?: boolean;
}

export function LocationPickerMap({
  latitude,
  longitude,
  onLocationChange,
  disabled = false,
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "success" | "denied" | "error">(
    "idle"
  );
  const [geoErrorMessage, setGeoErrorMessage] = useState<string | null>(null);

  const currentLat = latitude ?? DEFAULT_BUTUAN_CENTER[0];
  const currentLng = longitude ?? DEFAULT_BUTUAN_CENTER[1];
  const hasCoordinates = latitude !== null && longitude !== null;

  // Custom picker marker icon
  const createPickerIcon = () =>
    L.divIcon({
      className: "picker-leaflet-marker",
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute size-9 rounded-full bg-primary/30 animate-ping"></span>
          <div class="relative size-10 rounded-full bg-primary text-primary-foreground ring-4 ring-background shadow-xl flex items-center justify-center">
            <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

  const updateMarkerPosition = useCallback(
    (lat: number, lng: number) => {
      if (!mapInstanceRef.current) return;

      if (!markerRef.current) {
        const marker = L.marker([lat, lng], {
          draggable: !disabled,
          icon: createPickerIcon(),
        }).addTo(mapInstanceRef.current);

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onLocationChange({ lat: parseFloat(pos.lat.toFixed(6)), lng: parseFloat(pos.lng.toFixed(6)) });
        });

        markerRef.current = marker;
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }

      mapInstanceRef.current.setView([lat, lng], Math.max(mapInstanceRef.current.getZoom(), 15));
    },
    [disabled, onLocationChange]
  );

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: hasCoordinates ? 15 : 13,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      if (disabled) return;
      const lat = parseFloat(e.latlng.lat.toFixed(6));
      const lng = parseFloat(e.latlng.lng.toFixed(6));
      onLocationChange({ lat, lng });
    });

    mapInstanceRef.current = map;

    if (hasCoordinates) {
      updateMarkerPosition(latitude, longitude);
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker position when prop updates
  useEffect(() => {
    if (latitude !== null && longitude !== null && mapInstanceRef.current) {
      updateMarkerPosition(latitude, longitude);
    }
  }, [latitude, longitude, updateMarkerPosition]);

  // Request browser geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      setGeoErrorMessage("Geolocation is not supported by your browser.");
      return;
    }

    setGeoStatus("locating");
    setGeoErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        setGeoStatus("success");
        onLocationChange({ lat, lng });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16);
        }
      },
      (error) => {
        console.warn("Geolocation permission error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoStatus("denied");
          setGeoErrorMessage(
            "Location permission was denied. You can manually click on the map to pinpoint the location."
          );
        } else {
          setGeoStatus("error");
          setGeoErrorMessage("Unable to retrieve your current location. Please select on the map.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1 font-medium bg-muted/50">
            <MapPin className="size-3.5 text-primary" />
            <span>Click or drag pin to select location</span>
          </Badge>
          {hasCoordinates && (
            <Badge variant="secondary" className="text-[11px] font-mono">
              {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
            </Badge>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseMyLocation}
          disabled={disabled || geoStatus === "locating"}
          className="text-xs gap-1.5 rounded-lg shrink-0 shadow-2xs"
        >
          {geoStatus === "locating" ? (
            <RefreshCw className="size-3.5 animate-spin text-primary" />
          ) : (
            <Navigation className="size-3.5 text-primary" />
          )}
          <span>{geoStatus === "locating" ? "Locating..." : "Use My Location"}</span>
        </Button>
      </div>

      {/* Geolocation feedback messages */}
      {geoStatus === "denied" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
          <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Location Permission Denied</p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
              {geoErrorMessage}
            </p>
          </div>
        </div>
      )}

      {geoStatus === "error" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <p>{geoErrorMessage}</p>
        </div>
      )}

      {geoStatus === "success" && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Location successfully pinpointed!</span>
        </div>
      )}

      {/* Map Element Container */}
      <div className="relative w-full h-[280px] sm:h-[320px] rounded-2xl border border-border/80 shadow-inner overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {!hasCoordinates && (
          <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center pointer-events-none px-4">
            <div className="bg-background/90 backdrop-blur-sm border border-border/80 rounded-full px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-md">
              Tap anywhere on the map to place the location pin
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
