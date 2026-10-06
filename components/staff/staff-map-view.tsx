"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BUTUAN_BARANGAYS } from "@/lib/constants/barangays";
import type { IncidentCategory, UserRole } from "@/types";
import type { StaffIncidentListItem } from "@/lib/data/staff";

const IncidentsMap = dynamic(
  () => import("@/components/map/incidents-map").then((m) => m.IncidentsMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[550px] rounded-2xl border border-border/80 bg-muted/40 animate-pulse flex items-center justify-center text-xs text-muted-foreground">
        Loading Operations Map View...
      </div>
    ),
  }
);

interface StaffMapViewProps {
  incidents: StaffIncidentListItem[];
  categories: IncidentCategory[];
  userRole: UserRole;
}

export function StaffMapView({ incidents, categories, userRole }: StaffMapViewProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [barangayFilter, setBarangayFilter] = useState<string>("all");

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (statusFilter !== "all" && inc.status !== statusFilter) return false;
      if (severityFilter !== "all" && inc.severity !== severityFilter) return false;
      if (categoryFilter !== "all" && inc.category_id !== categoryFilter) return false;
      if (barangayFilter !== "all" && inc.barangay !== barangayFilter) return false;
      return true;
    });
  }, [incidents, statusFilter, severityFilter, categoryFilter, barangayFilter]);

  const activeFiltersCount = [
    statusFilter !== "all",
    severityFilter !== "all",
    categoryFilter !== "all",
    barangayFilter !== "all",
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setStatusFilter("all");
    setSeverityFilter("all");
    setCategoryFilter("all");
    setBarangayFilter("all");
  };

  const incidentsWithGps = filteredIncidents.filter(
    (i) => typeof i.latitude === "number" && typeof i.longitude === "number"
  );

  return (
    <div className="space-y-5">
      {/* Map Control Toolbar */}
      <Card className="rounded-2xl border-border/70 p-4 shadow-sm bg-card">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-primary" />
              <span className="text-sm font-bold text-foreground">Map Filters</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-semibold">
                  {activeFiltersCount} active
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Showing <strong>{filteredIncidents.length}</strong> incidents (
                <strong>{incidentsWithGps.length}</strong> with GPS)
              </span>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <RefreshCw className="size-3" />
                  <span>Reset</span>
                </Button>
              )}
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Status */}
            <div className="space-y-1">
              <label htmlFor="map-status" className="text-[11px] font-semibold text-muted-foreground">
                Status
              </label>
              <select
                id="map-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Severity */}
            <div className="space-y-1">
              <label htmlFor="map-severity" className="text-[11px] font-semibold text-muted-foreground">
                Severity
              </label>
              <select
                id="map-severity"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label htmlFor="map-category" className="text-[11px] font-semibold text-muted-foreground">
                Category
              </label>
              <select
                id="map-category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Barangay */}
            <div className="space-y-1">
              <label htmlFor="map-barangay" className="text-[11px] font-semibold text-muted-foreground">
                Barangay
              </label>
              <select
                id="map-barangay"
                value={barangayFilter}
                onChange={(e) => setBarangayFilter(e.target.value)}
                className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All Barangays ({BUTUAN_BARANGAYS.length})</option>
                {BUTUAN_BARANGAYS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Interactive Map */}
      <IncidentsMap incidents={filteredIncidents} role={userRole} height="h-[560px]" />
    </div>
  );
}
