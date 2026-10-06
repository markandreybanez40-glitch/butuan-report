"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Filter, X, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BUTUAN_BARANGAYS } from "@/lib/constants/barangays";
import type { IncidentCategory } from "@/types";

interface StaffQueueFilterProps {
  categories: IncidentCategory[];
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "rejected", label: "Rejected" },
  { value: "duplicate", label: "Duplicate" },
  { value: "cancelled", label: "Cancelled" },
];

const SEVERITY_OPTIONS = [
  { value: "all", label: "All Severities" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function StaffQueueFilter({ categories }: StaffQueueFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentStatus = searchParams.get("status") || "all";
  const currentSeverity = searchParams.get("severity") || "all";
  const currentCategory = searchParams.get("category") || "all";
  const currentBarangay = searchParams.get("barangay") || "all";
  const currentQuery = searchParams.get("q") || "";

  const [searchTerm, setSearchTerm] = useState(currentQuery);

  useEffect(() => {
    setSearchTerm(currentQuery);
  }, [currentQuery]);

  const applyFilters = (updates: {
    status?: string;
    severity?: string;
    category?: string;
    barangay?: string;
    q?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    const nextStatus = updates.status !== undefined ? updates.status : currentStatus;
    const nextSeverity = updates.severity !== undefined ? updates.severity : currentSeverity;
    const nextCategory = updates.category !== undefined ? updates.category : currentCategory;
    const nextBarangay = updates.barangay !== undefined ? updates.barangay : currentBarangay;
    const nextQ = updates.q !== undefined ? updates.q : searchTerm;

    if (nextStatus && nextStatus !== "all") {
      params.set("status", nextStatus);
    } else {
      params.delete("status");
    }

    if (nextSeverity && nextSeverity !== "all") {
      params.set("severity", nextSeverity);
    } else {
      params.delete("severity");
    }

    if (nextCategory && nextCategory !== "all") {
      params.set("category", nextCategory);
    } else {
      params.delete("category");
    }

    if (nextBarangay && nextBarangay !== "all") {
      params.set("barangay", nextBarangay);
    } else {
      params.delete("barangay");
    }

    if (nextQ && nextQ.trim()) {
      params.set("q", nextQ.trim());
    } else {
      params.delete("q");
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ q: searchTerm });
  };

  const hasActiveFilters =
    currentStatus !== "all" ||
    currentSeverity !== "all" ||
    currentCategory !== "all" ||
    currentBarangay !== "all" ||
    currentQuery !== "";

  const handleReset = () => {
    setSearchTerm("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-card p-4 shadow-xs">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search queue by report #, title, barangay, or description..."
            className="pl-9 pr-8 bg-background h-9 text-xs sm:text-sm"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                applyFilters({ q: "" });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </form>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isPending}
            className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground self-end lg:self-center gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset Filters</span>
          </Button>
        )}
      </div>

      {/* Filter Select Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {/* Status Dropdown */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Filter className="size-3" />
            <span>Status</span>
          </label>
          <select
            value={currentStatus}
            disabled={isPending}
            onChange={(e) => applyFilters({ status: e.target.value })}
            className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Severity Dropdown */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">
            Severity
          </label>
          <select
            value={currentSeverity}
            disabled={isPending}
            onChange={(e) => applyFilters({ severity: e.target.value })}
            className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Dropdown */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">
            Category
          </label>
          <select
            value={currentCategory}
            disabled={isPending}
            onChange={(e) => applyFilters({ category: e.target.value })}
            className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Barangay Dropdown */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">
            Barangay
          </label>
          <select
            value={currentBarangay}
            disabled={isPending}
            onChange={(e) => applyFilters({ barangay: e.target.value })}
            className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Barangays</option>
            {BUTUAN_BARANGAYS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
