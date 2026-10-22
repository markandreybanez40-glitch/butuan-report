"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import {
  MapPin,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  LocateFixed,
  X,
  Compass,
  Check,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ReverseGeocodeResult } from "@/lib/geocoding";

const DEFAULT_BUTUAN_CENTER: [number, number] = [8.9475, 125.5406];

interface LocationPickerMapProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (coords: { lat: number; lng: number }) => void;
  onAddressResolved?: (address: ReverseGeocodeResult) => void;
  onClearLocation?: () => void;
  disabled?: boolean;
}

export function LocationPickerMap({
  latitude,
  longitude,
  onLocationChange,
  onAddressResolved,
  onClearLocation,
  disabled = false,
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const activeFetchControllerRef = useRef<AbortController | null>(null);

  // Geolocation state
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "locating" | "confirming" | "success" | "denied" | "error"
  >("idle");
  const [geoErrorMessage, setGeoErrorMessage] = useState<string | null>(null);
  const [pendingGpsCoords, setPendingGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Reverse Geocoding state
  const [reverseGeoStatus, setReverseGeoStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [lastResolvedAddress, setLastResolvedAddress] = useState<string | null>(null);

  const hasCoordinates =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !isNaN(latitude) &&
    !isNaN(longitude);

  const currentLat = hasCoordinates ? latitude : DEFAULT_BUTUAN_CENTER[0];
  const currentLng = hasCoordinates ? longitude : DEFAULT_BUTUAN_CENTER[1];

  // Custom picker marker icon
  const createPickerIcon = () =>
    L.divIcon({
      className: "picker-leaflet-marker",
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute size-9 rounded-full bg-primary/40 animate-ping"></span>
          <div class="relative size-10 rounded-full bg-primary text-primary-foreground ring-4 ring-background shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing">
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

  // Perform reverse geocoding via server API route
  const performReverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      if (activeFetchControllerRef.current) {
        activeFetchControllerRef.current.abort();
      }

      const controller = new AbortController();
      activeFetchControllerRef.current = controller;

      setReverseGeoStatus("loading");

      try {
        const res = await fetch(
          `/api/geocoding/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          throw new Error(`Reverse geocode failed with HTTP ${res.status}`);
        }

        const json = await res.json();
        if (json.success && json.data) {
          const result: ReverseGeocodeResult = json.data;
          setReverseGeoStatus("success");
          setLastResolvedAddress(result.formattedAddress || null);
          onAddressResolved?.(result);
        } else {
          setReverseGeoStatus("error");
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // Ignore aborted requests
        }
        console.warn("Reverse geocode request failed:", err);
        setReverseGeoStatus("error");
      }
    },
    [onAddressResolved]
  );

  // Update or place marker on the Leaflet map
  const updateMarkerPosition = useCallback(
    (lat: number, lng: number, shouldFlyTo = false) => {
      if (!mapInstanceRef.current) return;

      if (!markerRef.current) {
        const marker = L.marker([lat, lng], {
          draggable: !disabled,
          icon: createPickerIcon(),
        }).addTo(mapInstanceRef.current);

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          const cleanLat = parseFloat(pos.lat.toFixed(6));
          const cleanLng = parseFloat(pos.lng.toFixed(6));
          onLocationChange({ lat: cleanLat, lng: cleanLng });
          performReverseGeocode(cleanLat, cleanLng);
        });

        markerRef.current = marker;
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }

      if (shouldFlyTo) {
        mapInstanceRef.current.flyTo([lat, lng], Math.max(mapInstanceRef.current.getZoom(), 16), {
          duration: 1,
        });
      }
    },
    [disabled, onLocationChange, performReverseGeocode]
  );

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: hasCoordinates ? 16 : 13,
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

      // Dismiss any open GPS confirmation dialog if user clicks on map directly
      setGeoStatus("idle");
      setPendingGpsCoords(null);

      onLocationChange({ lat, lng });
      performReverseGeocode(lat, lng);
    });

    mapInstanceRef.current = map;

    if (hasCoordinates) {
      updateMarkerPosition(latitude!, longitude!, false);
    }

    return () => {
      if (activeFetchControllerRef.current) {
        activeFetchControllerRef.current.abort();
      }
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker position when latitude or longitude props change
  useEffect(() => {
    if (hasCoordinates && mapInstanceRef.current) {
      updateMarkerPosition(latitude!, longitude!, false);
    } else if (!hasCoordinates && markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
      setLastResolvedAddress(null);
      setReverseGeoStatus("idle");
    }
  }, [hasCoordinates, latitude, longitude, updateMarkerPosition]);

  // Request browser geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      setGeoErrorMessage("Geolocation is not supported by your browser. Please tap on the map to set location.");
      return;
    }

    setGeoStatus("locating");
    setGeoErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));

        // Pan map toward the detected GPS coordinates so user has spatial context
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([lat, lng]);
        }

        // Store detected coordinates and prompt user to confirm
        setPendingGpsCoords({ lat, lng });
        setGeoStatus("confirming");
      },
      (error) => {
        console.warn("Geolocation error code:", error.code, error.message);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoStatus("denied");
          setGeoErrorMessage(
            "Location permission was denied. You can manually tap or drag the marker anywhere on the map to select the incident location."
          );
        } else if (error.code === error.TIMEOUT) {
          setGeoStatus("error");
          setGeoErrorMessage("Location request timed out. Please tap directly on the map to select the incident location.");
        } else {
          setGeoStatus("error");
          setGeoErrorMessage("Unable to retrieve your current location. Please select the location directly on the map.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // User confirms that device location is the incident location
  const handleConfirmGpsLocation = () => {
    if (!pendingGpsCoords) return;

    const { lat, lng } = pendingGpsCoords;
    onLocationChange({ lat, lng });
    updateMarkerPosition(lat, lng, true);
    performReverseGeocode(lat, lng);

    setGeoStatus("success");
    setPendingGpsCoords(null);
  };

  // User cancels GPS confirmation to pick location on map instead
  const handleCancelGpsLocation = () => {
    setGeoStatus("idle");
    setPendingGpsCoords(null);
  };

  const handleClearPin = () => {
    if (onClearLocation) {
      onClearLocation();
    } else {
      onLocationChange({ lat: 0, lng: 0 }); // Fallback if onClearLocation not provided
    }
    setGeoStatus("idle");
    setPendingGpsCoords(null);
    setReverseGeoStatus("idle");
    setLastResolvedAddress(null);
  };

  return (
    <div className="space-y-3">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1.5 font-medium bg-card/80 py-1">
            <MapPin className="size-3.5 text-primary" />
            <span>Tap map or drag pin to incident scene</span>
          </Badge>

          {hasCoordinates && (
            <Badge variant="secondary" className="text-[11px] font-mono py-1 px-2">
              {latitude!.toFixed(6)}, {longitude!.toFixed(6)}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasCoordinates && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearPin}
              disabled={disabled}
              className="text-xs h-8 px-2.5 text-muted-foreground hover:text-destructive gap-1"
            >
              <RotateCcw className="size-3" />
              <span>Clear Pin</span>
            </Button>
          )}

          <Button
            type="button"
            variant={geoStatus === "confirming" ? "secondary" : "outline"}
            size="sm"
            onClick={handleUseMyLocation}
            disabled={disabled || geoStatus === "locating"}
            className="text-xs gap-1.5 rounded-lg shrink-0 shadow-2xs font-medium"
          >
            {geoStatus === "locating" ? (
              <RefreshCw className="size-3.5 animate-spin text-primary" />
            ) : (
              <LocateFixed className="size-3.5 text-primary" />
            )}
            <span>{geoStatus === "locating" ? "Locating via GPS..." : "Use My Current Location"}</span>
          </Button>
        </div>
      </div>

      {/* GPS Confirmation Prompt Modal / Card */}
      {geoStatus === "confirming" && pendingGpsCoords && (
        <div className="rounded-xl border-2 border-primary/40 bg-card p-4 shadow-md space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs sm:text-sm">
              <Compass className="size-4 shrink-0" />
              <span>Confirm Incident Location</span>
            </div>
            <button
              type="button"
              onClick={handleCancelGpsLocation}
              className="text-muted-foreground hover:text-foreground text-xs p-1"
              aria-label="Close confirmation"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <p className="text-foreground leading-relaxed">
              GPS detected your current device position at{" "}
              <strong className="font-mono text-primary font-bold">
                {pendingGpsCoords.lat.toFixed(6)}, {pendingGpsCoords.lng.toFixed(6)}
              </strong>
              .
            </p>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              <strong>Please Note:</strong> GPS identifies where you are standing right now, which may differ from where the incident actually occurred. Confirm if you want to use this as the incident location, or cancel to tap and drag on the map.
            </p>
            {hasCoordinates && (
              <p className="text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                Confirming will update your previously selected coordinates.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelGpsLocation}
              className="text-xs h-8"
            >
              Cancel / Select on Map
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleConfirmGpsLocation}
              className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground shadow-xs font-semibold"
            >
              <Check className="size-3.5" />
              <span>Yes, Set as Incident Location</span>
            </Button>
          </div>
        </div>
      )}

      {/* Geolocation feedback messages */}
      {geoStatus === "denied" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">GPS Permission Denied</p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
              {geoErrorMessage}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setGeoStatus("idle")}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {geoStatus === "error" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive dark:text-red-300 flex items-start gap-2.5">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">GPS Signal Unavailable</p>
            <p className="text-[11px] mt-0.5 leading-relaxed">{geoErrorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setGeoStatus("idle")}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {geoStatus === "success" && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">Device GPS location verified and pinned to incident!</span>
          </div>
          <button
            type="button"
            onClick={() => setGeoStatus("idle")}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Map Element Container */}
      <div className="relative w-full h-[280px] sm:h-[340px] rounded-2xl border border-border/80 shadow-inner overflow-hidden bg-muted">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating guidance pill when no pin placed */}
        {!hasCoordinates && (
          <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center pointer-events-none px-4">
            <div className="bg-background/95 backdrop-blur-md border border-border/80 rounded-full px-4 py-1.5 text-[11px] font-medium text-foreground shadow-lg flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" />
              <span>Tap anywhere on the map or use GPS to place the incident pin</span>
            </div>
          </div>
        )}

        {/* Reverse Geocoding Status Badge on Map */}
        {hasCoordinates && (
          <div className="absolute left-3 bottom-3 z-20 max-w-[85%] pointer-events-none">
            <div className="bg-background/90 backdrop-blur-md border border-border/70 rounded-xl px-3 py-1.5 text-[11px] shadow-md flex items-center gap-2">
              {reverseGeoStatus === "loading" ? (
                <>
                  <RefreshCw className="size-3 animate-spin text-primary shrink-0" />
                  <span className="text-muted-foreground truncate">Detecting address details...</span>
                </>
              ) : reverseGeoStatus === "success" && lastResolvedAddress ? (
                <>
                  <CheckCircle className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-foreground font-medium truncate" title={lastResolvedAddress}>
                    {lastResolvedAddress}
                  </span>
                </>
              ) : reverseGeoStatus === "error" ? (
                <>
                  <AlertCircle className="size-3 text-amber-500 shrink-0" />
                  <span className="text-muted-foreground">Coordinates pinned. Manual address entry available below.</span>
                </>
              ) : (
                <>
                  <MapPin className="size-3 text-primary shrink-0" />
                  <span className="text-muted-foreground font-mono">
                    {latitude!.toFixed(6)}, {longitude!.toFixed(6)}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
