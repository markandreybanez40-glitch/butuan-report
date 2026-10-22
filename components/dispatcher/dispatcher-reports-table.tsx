"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  UserCheck,
  Calendar,
  MapPin,
  ArrowRight,
  Inbox,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IncidentStatusBadge, IncidentSeverityBadge } from "@/components/dashboard/status-badge";
import { BUTUAN_BARANGAYS } from "@/lib/constants/barangays";
import { cn } from "@/lib/utils";
import type { IncidentCategory } from "@/types";
import type { StaffIncidentListItem } from "@/lib/data/staff";

interface DispatcherReportsTableProps {
  incidents: StaffIncidentListItem[];
  categories: IncidentCategory[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
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

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "priority", label: "Priority / Severity" },
  { value: "oldest", label: "Oldest First" },
];

export function DispatcherReportsTable({
  incidents,
  categories,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
}: DispatcherReportsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentStatus = searchParams.get("status") || "all";
  const currentSeverity = searchParams.get("severity") || "all";
  const currentCategory = searchParams.get("category") || "all";
  const currentBarangay = searchParams.get("barangay") || "all";
  const currentSort = searchParams.get("sort") || "newest";
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
    sort?: string;
    q?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    const nextStatus = updates.status !== undefined ? updates.status : currentStatus;
    const nextSeverity = updates.severity !== undefined ? updates.severity : currentSeverity;
    const nextCategory = updates.category !== undefined ? updates.category : currentCategory;
    const nextBarangay = updates.barangay !== undefined ? updates.barangay : currentBarangay;
    const nextSort = updates.sort !== undefined ? updates.sort : currentSort;
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

    if (nextSort && nextSort !== "newest") {
      params.set("sort", nextSort);
    } else {
      params.delete("sort");
    }

    if (nextQ && nextQ.trim()) {
      params.set("q", nextQ.trim());
    } else {
      params.delete("q");
    }

    if (updates.page !== undefined) {
      if (updates.page > 1) {
        params.set("page", String(updates.page));
      } else {
        params.delete("page");
      }
    } else {
      params.delete("page");
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ q: searchTerm });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      applyFilters({ page: newPage });
    }
  };

  const hasActiveFilters =
    currentStatus !== "all" ||
    currentSeverity !== "all" ||
    currentCategory !== "all" ||
    currentBarangay !== "all" ||
    currentSort !== "newest" ||
    currentQuery !== "";

  const handleReset = () => {
    setSearchTerm("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const startIdx = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(totalCount, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Toolbar */}
      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Search incident reports"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reports by report #, title, citizen reporter, barangay, or keyword..."
              className="pl-9 pr-8 bg-background h-9 text-xs sm:text-sm"
            />
            {searchTerm && (
              <button
                type="button"
                aria-label="Clear search"
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

          {/* Reset Filters button */}
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

        {/* Filter Selects Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Status */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Filter className="size-3" />
              <span>Status</span>
            </label>
            <select
              value={currentStatus}
              disabled={isPending}
              aria-label="Filter by status"
              onChange={(e) => applyFilters({ status: e.target.value })}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Severity
            </label>
            <select
              value={currentSeverity}
              disabled={isPending}
              aria-label="Filter by severity"
              onChange={(e) => applyFilters({ severity: e.target.value })}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {SEVERITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Category
            </label>
            <select
              value={currentCategory}
              disabled={isPending}
              aria-label="Filter by category"
              onChange={(e) => applyFilters({ category: e.target.value })}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Barangay */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Barangay
            </label>
            <select
              value={currentBarangay}
              disabled={isPending}
              aria-label="Filter by barangay"
              onChange={(e) => applyFilters({ barangay: e.target.value })}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Barangays</option>
              {BUTUAN_BARANGAYS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <ArrowUpDown className="size-3" />
              <span>Sort By</span>
            </label>
            <select
              value={currentSort}
              disabled={isPending}
              aria-label="Sort incident reports"
              onChange={(e) => applyFilters({ sort: e.target.value })}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Header Count & Loading Indicator */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-foreground">{startIdx}–{endIdx}</strong> of{" "}
            <strong className="text-foreground">{totalCount}</strong> incident report{totalCount === 1 ? "" : "s"}
          </span>
          {isPending && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Loader2 className="size-3 animate-spin" />
              <span className="text-[11px]">Updating...</span>
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Reports Table */}
      {incidents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 p-12 text-center bg-card/50 flex flex-col items-center justify-center space-y-3">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Inbox className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">No reports match your filters</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Try adjusting your search criteria, clearing specific filters, or resetting to default view.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-card shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <TableRow>
                    <TableHead className="w-[120px]">Report #</TableHead>
                    <TableHead className="min-w-[220px]">Title & Description</TableHead>
                    <TableHead className="w-[120px]">Category</TableHead>
                    <TableHead className="w-[90px]">Severity</TableHead>
                    <TableHead className="w-[110px]">Status</TableHead>
                    <TableHead className="w-[130px]">Barangay</TableHead>
                    <TableHead className="w-[160px]">Assignment</TableHead>
                    <TableHead className="w-[110px]">Created</TableHead>
                    <TableHead className="w-[100px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {incidents.map((incident) => {
                    const dateStr = new Date(incident.created_at).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

                    const activeAssignment = incident.assignments?.find(
                      (a) => a.unassigned_at === null
                    );

                    const isCritical = incident.severity === "critical";

                    return (
                      <TableRow
                        key={incident.id}
                        className={cn(
                          "hover:bg-muted/40 transition-colors group",
                          isCritical ? "bg-destructive/5" : ""
                        )}
                      >
                        {/* Report Number */}
                        <TableCell className="font-mono font-bold text-xs">
                          <Link
                            href={`/dispatcher/reports/${incident.id}`}
                            className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                          >
                            <span>{incident.report_number}</span>
                          </Link>
                        </TableCell>

                        {/* Title & Reporter */}
                        <TableCell className="max-w-[280px]">
                          <div className="space-y-1">
                            <Link
                              href={`/dispatcher/reports/${incident.id}`}
                              className="font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1"
                            >
                              {incident.title}
                            </Link>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {incident.description}
                            </p>
                            {incident.reporter && (
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-0.5">
                                <span>Citizen:</span>
                                <strong className="text-foreground/80 truncate">
                                  {incident.reporter.full_name}
                                </strong>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          <Badge variant="outline" className="text-[11px] font-normal truncate max-w-[110px]">
                            {incident.category?.name || "General"}
                          </Badge>
                        </TableCell>

                        {/* Severity */}
                        <TableCell>
                          <IncidentSeverityBadge severity={incident.severity} />
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <IncidentStatusBadge status={incident.status} />
                        </TableCell>

                        {/* Barangay */}
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-foreground/90">
                            <MapPin className="size-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{incident.barangay}</span>
                          </div>
                        </TableCell>

                        {/* Assignment */}
                        <TableCell>
                          {activeAssignment ? (
                            <div className="space-y-1 text-[11px]">
                              <div className="flex items-center gap-1 font-medium text-foreground">
                                <Building2 className="size-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span className="truncate">{activeAssignment.department?.name || "Dept"}</span>
                              </div>
                              {activeAssignment.assigned_user && (
                                <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
                                  <UserCheck className="size-2.5 text-blue-500 shrink-0" />
                                  <span className="truncate">{activeAssignment.assigned_user.full_name}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                              Unassigned
                            </span>
                          )}
                        </TableCell>

                        {/* Created Date */}
                        <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3 text-muted-foreground" />
                            <span>{dateStr}</span>
                          </div>
                        </TableCell>

                        {/* Action Button */}
                        <TableCell className="text-right">
                          <Link
                            href={`/dispatcher/reports/${incident.id}`}
                            className={cn(
                              buttonVariants({ size: "sm" }),
                              "bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold px-2.5 py-1 h-auto shadow-2xs gap-1"
                            )}
                          >
                            <span>Dispatch</span>
                            <ArrowRight className="size-3" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
              <div className="text-xs">
                Page <strong className="text-foreground">{currentPage}</strong> of{" "}
                <strong className="text-foreground">{totalPages}</strong>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isPending}
                  className="h-8 text-xs gap-1"
                >
                  <ChevronLeft className="size-3.5" />
                  <span>Previous</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5) {
                      if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                    }
                    const isActive = pageNum === currentPage;
                    return (
                      <Button
                        key={pageNum}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={isPending}
                        className={cn(
                          "h-8 w-8 p-0 text-xs",
                          isActive ? "bg-amber-500 hover:bg-amber-600 text-white" : ""
                        )}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || isPending}
                  className="h-8 text-xs gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
