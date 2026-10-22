"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Tags,
  Plus,
  Edit2,
  Power,
  PowerOff,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Search,
  X,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createCategoryAction,
  updateCategoryAction,
  toggleCategoryStatusAction,
} from "@/app/admin/actions";
import type { IncidentCategory } from "@/types";

interface CategoriesManagerProps {
  categories: IncidentCategory[];
}

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<IncidentCategory | null>(null);
  const [confirmToggleCat, setConfirmToggleCat] = useState<IncidentCategory | null>(null);

  // Form States
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setDescription("");
    setFeedbackError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (cat: IncidentCategory) => {
    resetForm();
    setEditingCat(cat);
    setName(cat.name);
    setDescription(cat.description || "");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);

    if (!name.trim() || name.trim().length < 3) {
      setFeedbackError("Category name must be at least 3 characters.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("description", description.trim());

    startTransition(async () => {
      const result = await createCategoryAction(formData);
      if (!result.success) {
        setFeedbackError(result.error || "Failed to create category");
      } else {
        setFeedbackSuccess(`Category "${name.trim()}" created successfully.`);
        setIsAddOpen(false);
        resetForm();
        router.refresh();
        setTimeout(() => setFeedbackSuccess(null), 4000);
      }
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;
    setFeedbackError(null);

    if (!name.trim() || name.trim().length < 3) {
      setFeedbackError("Category name must be at least 3 characters.");
      return;
    }

    const formData = new FormData();
    formData.append("category_id", editingCat.id);
    formData.append("name", name.trim());
    formData.append("description", description.trim());

    startTransition(async () => {
      const result = await updateCategoryAction(formData);
      if (!result.success) {
        setFeedbackError(result.error || "Failed to update category");
      } else {
        setFeedbackSuccess(`Category "${name.trim()}" updated successfully.`);
        setEditingCat(null);
        resetForm();
        router.refresh();
        setTimeout(() => setFeedbackSuccess(null), 4000);
      }
    });
  };

  const handleConfirmToggleStatus = () => {
    if (!confirmToggleCat) return;
    setFeedbackError(null);

    const formData = new FormData();
    formData.append("category_id", confirmToggleCat.id);
    formData.append("is_active", String(confirmToggleCat.is_active));

    startTransition(async () => {
      const result = await toggleCategoryStatusAction(formData);
      if (!result.success) {
        setFeedbackError(result.error || "Failed to update status");
      } else {
        const nextStatus = !confirmToggleCat.is_active ? "activated" : "deactivated";
        setFeedbackSuccess(`Category "${confirmToggleCat.name}" has been ${nextStatus}.`);
        setConfirmToggleCat(null);
        router.refresh();
        setTimeout(() => setFeedbackSuccess(null), 4000);
      }
    });
  };

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchesSearch =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.trim().toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.is_active) ||
        (statusFilter === "inactive" && !c.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [categories, searchQuery, statusFilter]);

  const activeCount = categories.filter((c) => c.is_active).length;

  return (
    <div className="space-y-4">
      {/* Feedback Messages */}
      {feedbackSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{feedbackSuccess}</span>
          </div>
          <button
            onClick={() => setFeedbackSuccess(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border/70 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground">Incident Hazard Categories</h2>
            <Badge variant="outline" className="text-xs">
              {activeCount} Active / {categories.length} Total
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Public classification options available to residents when filing civic hazard reports
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 self-start sm:self-center shadow-xs text-xs font-semibold"
        >
          <Plus className="size-4" />
          <span>Add Category</span>
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-3 rounded-xl border border-border/70 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search categories"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by name or scope guidance..."
            className="pl-9 pr-8 bg-background h-8 text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            aria-label="Filter categories by status"
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {(searchQuery || statusFilter !== "all") && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Categories Table */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[280px] text-xs font-semibold">Category Name</TableHead>
              <TableHead className="text-xs font-semibold">Citizen Guidance / Scope</TableHead>
              <TableHead className="w-[120px] text-xs font-semibold">Status</TableHead>
              <TableHead className="w-[120px] text-xs font-semibold">Created</TableHead>
              <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-xs">
                  {categories.length === 0
                    ? "No incident categories configured. Click 'Add Category' above to register options."
                    : "No categories matching your search or filter criteria."}
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((c) => {
                const dateStr = new Date(c.created_at).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <TableRow key={c.id} className="hover:bg-muted/30">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`size-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            c.is_active
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          <Tags className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {c.name}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground">
                            ID: {c.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground py-3 max-w-md">
                      {c.description || <span className="italic">No description provided</span>}
                    </TableCell>

                    <TableCell className="py-3">
                      {c.is_active ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-[11px] font-medium">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[11px]">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground font-mono py-3">
                      {dateStr}
                    </TableCell>

                    <TableCell className="text-right py-3 space-x-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleOpenEdit(c)}
                        disabled={isPending}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                      >
                        <Edit2 className="size-3" />
                        <span>Edit</span>
                      </Button>

                      <Button
                        variant={c.is_active ? "ghost" : "outline"}
                        size="xs"
                        onClick={() => setConfirmToggleCat(c)}
                        disabled={isPending}
                        className={`h-7 px-2 text-xs gap-1 ${
                          c.is_active
                            ? "text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                            : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                        }`}
                      >
                        {c.is_active ? (
                          <>
                            <PowerOff className="size-3" />
                            <span>Deactivate</span>
                          </>
                        ) : (
                          <>
                            <Power className="size-3" />
                            <span>Activate</span>
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tags className="size-5 text-blue-600 dark:text-blue-400" />
                <span>Add Incident Category</span>
              </DialogTitle>
              <DialogDescription>
                Create a new hazard classification available to residents reporting issues.
              </DialogDescription>
            </DialogHeader>

            {feedbackError && (
              <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{feedbackError}</span>
              </div>
            )}

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Category Name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Road Damage & Potholes or Flooding & Drainage"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Citizen Instructions / Scope
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly guide citizens on when to choose this category..."
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending || !name.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Create Category</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCat} onOpenChange={(open) => !open && setEditingCat(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUpdateSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="size-5 text-blue-600 dark:text-blue-400" />
                <span>Edit Incident Category</span>
              </DialogTitle>
              <DialogDescription>
                Update the official name or citizen guidance for this category.
              </DialogDescription>
            </DialogHeader>

            {feedbackError && (
              <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{feedbackError}</span>
              </div>
            )}

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Category Name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Citizen Instructions / Scope
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingCat(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending || !name.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Deactivate / Activate */}
      <Dialog open={!!confirmToggleCat} onOpenChange={(open) => !open && setConfirmToggleCat(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              <span>Confirm Status Change</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmToggleCat?.is_active ? "deactivate" : "activate"}{" "}
              <strong className="text-foreground">{confirmToggleCat?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-xs text-muted-foreground">
            {confirmToggleCat?.is_active ? (
              <p>
                Deactivating this category will hide it from the resident report submission form.
                Existing reports filed under this category will preserve their classification.
              </p>
            ) : (
              <p>
                Activating this category will make it immediately available to all Butuan City
                citizens when filing new hazard reports.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmToggleCat(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmToggleStatus}
              disabled={isPending}
              className={
                confirmToggleCat?.is_active
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Confirm {confirmToggleCat?.is_active ? "Deactivate" : "Activate"}</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
