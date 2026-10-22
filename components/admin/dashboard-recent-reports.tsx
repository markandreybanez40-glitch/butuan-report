"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  Inbox,
  User,
  Search,
  Filter,
  Tags,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IncidentStatusBadge } from "@/components/dashboard/status-badge";
import { ReportDetailsDrawer } from "@/components/admin/report-details-drawer";
import { cn } from "@/lib/utils";
import type { IncidentCategory } from "@/types";
import type { StaffIncidentListItem } from "@/lib/data/staff";

interface DashboardRecentReportsProps {
  incidents: StaffIncidentListItem[];
  categories: IncidentCategory[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_FILTER_OPTIONS = [
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

export function DashboardRecentReports({
  incidents,
  categories,
  totalCount,
  currentPage,
  totalPages,
}: DashboardRecentReportsProps) {
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

  const handleOpenReport = (id: string) => {
    setSelectedIncidentId(id);
    setDrawerOpen(true);
  };

  return (
    <>
      <Card className="border-border/70 shadow-2xs flex flex-col justify-between h-full">
        <div>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
            <div>
              <CardTitle className="text-sm font-bold text-foreground tracking-tight">
                Recent Reports
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time incident filings from Supabase with live triage management
              </CardDescription>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0 self-start sm:self-center"
            >
              <span>View Full Queue</span>
              <ArrowRight className="size-3" />
            </Link>
          </CardHeader>

          {/* Search and Filters Toolbar */}
          <div className="px-4 pb-3 space-y-2.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  type="search"
                  aria-label="Search reports"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search report #, title, resident..."
                  className="pl-8 pr-7 bg-background h-8 text-xs"
                />
                {searchTerm && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setSearchTerm("");
                      applyFilters({ q: "" });
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </form>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="size-3 text-muted-foreground shrink-0 hidden sm:inline" />
                <select
                  value={currentStatus}
                  disabled={isPending}
                  aria-label="Filter by status"
                  onChange={(e) => applyFilters({ status: e.target.value })}
                  className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-medium shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                >
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <Tags className="size-3 text-muted-foreground shrink-0 hidden sm:inline" />
                <select
                  value={currentCategory}
                  disabled={isPending}
                  aria-label="Filter by category"
                  onChange={(e) => applyFilters({ category: e.target.value })}
                  className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-medium shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 max-w-[130px] truncate"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={isPending}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="size-3" />
                </Button>
              )}
            </div>

            {/* Sub-toolbar loading & count */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
              <span>
                Total <strong className="text-foreground">{totalCount}</strong> matching record{totalCount === 1 ? "" : "s"}
              </span>
              {isPending && (
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <Loader2 className="size-2.5 animate-spin" />
                  <span>Updating...</span>
                </span>
              )}
            </div>
          </div>

          <CardContent className="p-0 border-t border-border/60">
            {incidents.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto">
                  <Inbox className="size-5" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  No incident reports found matching your criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <TableRow>
                      <TableHead className="w-[110px]">Report #</TableHead>
                      <TableHead className="min-w-[150px]">Resident</TableHead>
                      <TableHead className="w-[130px]">Category</TableHead>
                      <TableHead className="w-[110px]">Status</TableHead>
                      <TableHead className="w-[100px]">Date</TableHead>
                      <TableHead className="w-[80px] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {incidents.map((incident) => {
                      const dateStr = new Date(incident.created_at).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });

                      return (
                        <TableRow
                          key={incident.id}
                          className="hover:bg-muted/40 transition-colors cursor-pointer"
                          onClick={() => handleOpenReport(incident.id)}
                        >
                          {/* Report Number */}
                          <TableCell className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {incident.report_number}
                          </TableCell>

                          {/* Resident */}
                          <TableCell>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="size-5 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                                <User className="size-3" />
                              </div>
                              <div className="truncate">
                                <span className="font-semibold text-foreground block truncate">
                                  {incident.reporter?.full_name || "Anonymous Resident"}
                                </span>
                                <span className="text-[10px] text-muted-foreground block truncate">
                                  {incident.barangay}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Category */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[11px] font-normal truncate max-w-[120px] bg-muted/30"
                            >
                              {incident.category?.name || "General"}
                            </Badge>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <IncidentStatusBadge status={incident.status} />
                          </TableCell>

                          {/* Date */}
                          <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {dateStr}
                          </TableCell>

                          {/* View Action */}
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenReport(incident.id)}
                              className="h-7 px-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-semibold gap-1"
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
            )}
          </CardContent>
        </div>

        {/* Server-Side Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground bg-muted/10">
            <span>
              Page <strong className="text-foreground">{currentPage}</strong> of{" "}
              <strong className="text-foreground">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isPending}
                className="h-7 px-2 text-xs gap-1"
              >
                <ChevronLeft className="size-3" />
                <span className="hidden sm:inline">Prev</span>
              </Button>

              <div className="flex items-center gap-0.5">
                {Array.from({ length: Math.min(4, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 4) {
                    if (currentPage <= 2) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 1) {
                      pageNum = totalPages - 3 + i;
                    } else {
                      pageNum = currentPage - 1 + i;
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
                        "h-7 w-7 p-0 text-xs",
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
                className="h-7 px-2 text-xs gap-1"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="size-3" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Slide-out Report Details Drawer */}
      <ReportDetailsDrawer
        incidentId={selectedIncidentId}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedIncidentId(null);
        }}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </>
  );
}
