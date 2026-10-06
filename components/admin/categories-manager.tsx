"use client";

import { useState, useTransition } from "react";
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
  X,
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

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<IncidentCategory | null>(null);

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

  const handleToggleStatus = (cat: IncidentCategory) => {
    setFeedbackError(null);
    const formData = new FormData();
    formData.append("category_id", cat.id);
    formData.append("is_active", String(cat.is_active));

    startTransition(async () => {
      const result = await toggleCategoryStatusAction(formData);
      if (!result.success) {
        setFeedbackError(result.error || "Failed to update status");
      } else {
        const nextStatus = !cat.is_active ? "activated" : "deactivated";
        setFeedbackSuccess(`Category "${cat.name}" has been ${nextStatus}.`);
        router.refresh();
        setTimeout(() => setFeedbackSuccess(null), 4000);
      }
    });
  };

  const activeCount = categories.filter((c) => c.is_active).length;

  return (
    <div className="space-y-6">
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
          className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5 self-start sm:self-center"
        >
          <Plus className="size-4" />
          <span>Add Category</span>
        </Button>
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
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-xs">
                  No incident categories configured. Click &quot;Add Category&quot; above to register options.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((c) => {
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
                          className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                            c.is_active
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
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
                        onClick={() => handleToggleStatus(c)}
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
                <Tags className="size-5 text-purple-600" />
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
                className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
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
                <Edit2 className="size-5 text-purple-600" />
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
                className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
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
    </div>
  );
}
