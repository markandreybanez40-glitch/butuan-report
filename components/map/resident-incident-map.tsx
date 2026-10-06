"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Search,
  RotateCcw,
  MapPin,
  Info,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { IncidentWithCategory } from "@/lib/data/incidents";
import type { IncidentCategory } from "@/types";

const IncidentsMap = dynamic(
  () => import("@/components/map/incidents-map").then((m) => m.IncidentsMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] sm:h-[580px] rounded-2xl border border-border/80 bg-muted/40 animate-pulse flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
        <MapPin className="size-6 animate-bounce text-primary" />
        <span>Loading Interactive Incident Map...</span>
      </div>
    ),
  }
);

interface ResidentIncidentMapProps {
  initialIncidents: IncidentWithCategory[];
  categories: IncidentCategory[];
}

export function ResidentIncidentMap({
  initialIncidents,
  categories,
}: ResidentIncidentMapProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");

  const filteredIncidents = useMemo(() => {
    return initialIncidents.filter((inc) => {
      // 1. Search Query
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = inc.title?.toLowerCase().includes(query);
        const matchesNumber = inc.report_number?.toLowerCase().includes(query);
        const matchesBarangay = inc.barangay?.toLowerCase().includes(query);
        const matchesDesc = inc.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesNumber && !matchesBarangay && !matchesDesc) {
          return false;
        }
      }

      // 2. Category
      if (selectedCategory !== "all") {
        if (inc.category_id !== selectedCategory) return false;
      }

      // 3. Status
      if (selectedStatus !== "all") {
        if (inc.status !== selectedStatus) return false;
      }

      // 4. Severity
      if (selectedSeverity !== "all") {
        if (inc.severity !== selectedSeverity) return false;
      }

      return true;
    });
  }, [initialIncidents, search, selectedCategory, selectedStatus, selectedSeverity]);

  const incidentsWithLocation = useMemo(() => {
    return filteredIncidents.filter(
      (inc) => typeof inc.latitude === "number" && typeof inc.longitude === "number"
    );
  }, [filteredIncidents]);

  const hasFilters =
    search.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedStatus !== "all" ||
    selectedSeverity !== "all";

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setSelectedSeverity("all");
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <Card className="border-border/80 shadow-2xs p-3.5 bg-card">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search reports by title, number, or barangay..."
              aria-label="Search incident reports"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-background"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category */}
            <select
              value={selectedCategory}
              aria-label="Filter by incident category"
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              aria-label="Filter by status"
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            {/* Severity */}
            <select
              value={selectedSeverity}
              aria-label="Filter by severity"
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Reset */}
            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="size-3.5" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Stats and Legend Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <Card className="border-border/70 p-3 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] text-muted-foreground">Mapped Pins</span>
            <p className="text-base font-bold text-foreground">
              {incidentsWithLocation.length}{" "}
              <span className="text-[11px] font-normal text-muted-foreground">
                of {filteredIncidents.length} total
              </span>
            </p>
          </div>
          <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <MapPin className="size-4" />
          </div>
        </Card>

        <Card className="border-border/70 p-3 sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
            Severity Pin Colors:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-red-500/10 text-red-700 dark:text-red-300 border-red-300/40">
              Critical
            </Badge>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-300/40">
              High
            </Badge>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/40">
              Medium
            </Badge>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300/40">
              Low
            </Badge>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/40">
              Resolved
            </Badge>
          </div>
        </Card>
      </div>

      {/* Leaflet Map Component */}
      <div className="relative">
        <IncidentsMap
          incidents={filteredIncidents}
          role="resident"
          height="h-[520px] sm:h-[580px]"
        />
      </div>

      {/* Safety & Privacy Notice */}
      <div className="rounded-xl border border-border/70 bg-muted/30 p-3 text-[11px] text-muted-foreground flex items-center gap-2">
        <Info className="size-4 text-primary shrink-0" />
        <span>
          <strong>Citizen Privacy Guard:</strong> Map pins show general hazard classification and barangay location. Personal reporter identities, phone numbers, and private internal notes are never displayed on public map views.
        </span>
      </div>
    </div>
  );
}
