"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  Filter,
  MapPin,
  Inbox,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  User,
  Tags,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IncidentStatusBadge } from "@/components/dashboard/status-badge";
import { ReportDetailsDrawer } from "@/components/admin/report-details-drawer";
import { cn } from "@/lib/utils";
import type { IncidentCategory, Department } from "@/types";
import type { StaffIncidentListItem, AssignableStaffMember } from "@/lib/data/staff";

interface AdminReportsTableProps {
  incidents: StaffIncidentListItem[];
  categories: IncidentCategory[];
  departments?: Department[];
  staffMembers?: AssignableStaffMember[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "submitted", label: "Pending (Submitted)" },
  { value: "under_review", label: "Under Review" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "rejected", label: "Rejected" },
  { value: "duplicate", label: "Duplicate" },
  { value: "cancelled", label: "Cancelled" },
];

export function AdminReportsTable({
  incidents,
  categories,
  departments = [],
  staffMembers = [],
  totalCount,
  currentPage,
  pageSize,
  totalPages,
}: AdminReportsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentStatus = searchParams.get("status") || "all";
  const currentCategory = searchParams.get("category") || "all";
  const currentQuery = searchParams.get("q") || "";

  const [searchTerm, setSearchTerm] = useState(currentQuery);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    setSearchTerm(currentQuery);
  }, [currentQuery]);

  const applyFilters = (updates: {
    status?: string;
    category?: string;
    q?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    const nextStatus = updates.status !== undefined ? updates.status : currentStatus;
    const nextCategory = updates.category !== undefined ? updates.category : currentCategory;
    const nextQ = updates.q !== undefined ? updates.q : searchTerm;

    if (nextStatus && nextStatus !== "all") {
      params.set("status", nextStatus);
    } else {
      params.delete("status");
    }

    if (nextCategory && nextCategory !== "all") {
      params.set("category", nextCategory);
    } else {
      params.delete("category");
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
    currentStatus !== "all" || currentCategory !== "all" || currentQuery !== "";

  const handleReset = () => {
    setSearchTerm("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const handleOpenDrawer = (id: string) => {
    setSelectedIncidentId(id);
    setDrawerOpen(true);
  };

  const startIdx = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(totalCount, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Search incident reports"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reports by report #, title, resident name, or barangay..."
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

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            {/* Filter by Status */}
            <div className="flex items-center gap-1.5 min-w-[140px]">
              <Filter className="size-3.5 text-muted-foreground shrink-0" />
              <select
                value={currentStatus}
                disabled={isPending}
                aria-label="Filter by status"
                onChange={(e) => applyFilters({ status: e.target.value })}
                className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Category */}
            <div className="flex items-center gap-1.5 min-w-[140px]">
              <Tags className="size-3.5 text-muted-foreground shrink-0" />
              <select
                value={currentCategory}
                disabled={isPending}
                aria-label="Filter by category"
                onChange={(e) => applyFilters({ category: e.target.value })}
                className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters button */}
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isPending}
                className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Results Header Count & Loading Indicator */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-foreground">{startIdx}–{endIdx}</strong> of{" "}
            <strong className="text-foreground">{totalCount}</strong> reports
          </span>
          {isPending && (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Loader2 className="size-3 animate-spin" />
              <span className="text-[11px]">Updating...</span>
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Main Reports Table */}
      {incidents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 p-12 text-center bg-card/50 flex flex-col items-center justify-center space-y-3">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Inbox className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">No reports match your filters</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Try adjusting your search keywords, changing the status filter, or resetting to default view.
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
                    <TableHead className="min-w-[170px]">Resident</TableHead>
                    <TableHead className="w-[130px]">Category</TableHead>
                    <TableHead className="w-[110px]">Status</TableHead>
                    <TableHead className="w-[150px]">Assigned Agency & Responder</TableHead>
                    <TableHead className="w-[130px]">Location</TableHead>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[90px] text-right">Action</TableHead>
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

                    return (
                      <TableRow
                        key={incident.id}
                        className="hover:bg-muted/40 transition-colors cursor-pointer group"
                        onClick={() => handleOpenDrawer(incident.id)}
                      >
                        {/* Report Number */}
                        <TableCell className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                          {incident.report_number}
                        </TableCell>

                        {/* Resident */}
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="size-6 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                              <User className="size-3.5" />
                            </div>
                            <div className="truncate">
                              <span className="font-semibold text-foreground block truncate">
                                {incident.reporter?.full_name || "Anonymous Resident"}
                              </span>
                              <span className="text-[10px] text-muted-foreground block truncate">
                                {incident.title}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[11px] font-normal truncate max-w-[130px] bg-muted/20"
                          >
                            {incident.category?.name || "General"}
                          </Badge>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <IncidentStatusBadge status={incident.status} />
                        </TableCell>

                        {/* Assigned Department & Field Responder */}
                        <TableCell>
                          {activeAssignment ? (
                            <div className="truncate max-w-[140px] space-y-0.5">
                              <span className="font-semibold text-foreground block truncate text-xs">
                                {activeAssignment.department?.name || "General Agency"}
                              </span>
                              <span className="text-[10px] text-muted-foreground block truncate">
                                {activeAssignment.assigned_user?.full_name || "Department Pool"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">Unassigned</span>
                          )}
                        </TableCell>

                        {/* Location */}
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-foreground/90 truncate max-w-[130px]">
                            <MapPin className="size-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{incident.barangay}</span>
                          </div>
                        </TableCell>

                        {/* Created Date */}
                        <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {dateStr}
                        </TableCell>

                        {/* Action */}
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDrawer(incident.id)}
                            className="h-7 px-2.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-semibold gap-1"
                          >
                            <Eye className="size-3.5" />
                            <span>View</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Server-Side Pagination */}
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
                          isActive ? "bg-blue-600 hover:bg-blue-700 text-white font-semibold" : ""
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

      {/* Slide-out Report Details Drawer */}
      <ReportDetailsDrawer
        incidentId={selectedIncidentId}
        isOpen={drawerOpen}
        departments={departments}
        staffMembers={staffMembers}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedIncidentId(null);
        }}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
