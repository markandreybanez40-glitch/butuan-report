"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
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
  createDepartmentAction,
  updateDepartmentAction,
  toggleDepartmentStatusAction,
} from "@/app/admin/actions";
import type { Department } from "@/types";

interface DepartmentsManagerProps {
  departments: Department[];
}

export function DepartmentsManager({ departments }: DepartmentsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

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

  const handleOpenEdit = (dept: Department) => {
    resetForm();
    setEditingDept(dept);
    setName(dept.name);
    setDescription(dept.description || "");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);

    if (!name.trim() || name.trim().length < 3) {
      setFeedbackError("Department name must be at least 3 characters.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("description", description.trim());

    startTransition(async () => {
      const result = await createDepartmentAction(formData);
      if (!result.success) {
        setFeedbackError(result.error || "Failed to create department");
      } else {
        setFeedbackSuccess(`Department "${name.trim()}" created successfully.`);
        setIsAddOpen(false);
        resetForm();
        router.refresh();
        setTimeout(() => setFeedbackSuccess(null), 4000);
      }
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    setFeedbackError(null);

    if (!name.trim() || name.trim().length < 3) {
      setFeedbackError("Department name must be at least 3 characters.");
      return;
    }

    const formData = new FormData();
    formData.append("department_id", editingDept.id);
    formData.append("name", name.trim());
    formData.append("description", description.trim());

    startTransition(async () => {
      const result = await updateDepartmentAction(formData);
      if (!result.success) {
        setFeedbackError(result.error || "Failed to update department");
      } else {
        setFeedbackSuccess(`Department "${name.trim()}" updated successfully.`);
        setEditingDept(null);
        resetForm();
        router.refresh();
        setTimeout(() => setFeedbackSuccess(null), 4000);
      }
    });
  };

  const handleToggleStatus = (dept: Department) => {
    setFeedbackError(null);
    const formData = new FormData();
    formData.append("department_id", dept.id);
    formData.append("is_active", String(dept.is_active));

    startTransition(async () => {
      const result = await toggleDepartmentStatusAction(formData);
      if (!result.success) {
        setFeedbackError(result.error || "Failed to update status");
      } else {
        const nextStatus = !dept.is_active ? "activated" : "deactivated";
        setFeedbackSuccess(`Department "${dept.name}" has been ${nextStatus}.`);
        router.refresh();
        setTimeout(() => setFeedbackSuccess(null), 4000);
      }
    });
  };

  const activeCount = departments.filter((d) => d.is_active).length;

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
            <h2 className="text-sm font-bold text-foreground">Municipal Departments</h2>
            <Badge variant="outline" className="text-xs">
              {activeCount} Active / {departments.length} Total
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Agencies and offices responsible for fielding and resolving civic hazard reports
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5 self-start sm:self-center"
        >
          <Plus className="size-4" />
          <span>Add Department</span>
        </Button>
      </div>

      {/* Departments Table */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[280px] text-xs font-semibold">Department Name</TableHead>
              <TableHead className="text-xs font-semibold">Operational Scope</TableHead>
              <TableHead className="w-[120px] text-xs font-semibold">Status</TableHead>
              <TableHead className="w-[120px] text-xs font-semibold">Created</TableHead>
              <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-xs">
                  No departments found. Click &quot;Add Department&quot; above to configure municipal offices.
                </TableCell>
              </TableRow>
            ) : (
              departments.map((d) => {
                const dateStr = new Date(d.created_at).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <TableRow key={d.id} className="hover:bg-muted/30">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                            d.is_active
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Building2 className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {d.name}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground">
                            ID: {d.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground py-3 max-w-md">
                      {d.description || <span className="italic">No description provided</span>}
                    </TableCell>

                    <TableCell className="py-3">
                      {d.is_active ? (
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
                        onClick={() => handleOpenEdit(d)}
                        disabled={isPending}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                      >
                        <Edit2 className="size-3" />
                        <span>Edit</span>
                      </Button>

                      <Button
                        variant={d.is_active ? "ghost" : "outline"}
                        size="xs"
                        onClick={() => handleToggleStatus(d)}
                        disabled={isPending}
                        className={`h-7 px-2 text-xs gap-1 ${
                          d.is_active
                            ? "text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                            : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                        }`}
                      >
                        {d.is_active ? (
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

      {/* Add Department Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="size-5 text-purple-600" />
                <span>Add Municipal Department</span>
              </DialogTitle>
              <DialogDescription>
                Register a new civic agency or municipal operating unit in Butuan Report.
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
                  Department Name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., CDRRMO or City Engineering Office (CEO)"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Description & Scope</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe operational responsibilities and types of incidents handled..."
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
                  <span>Create Department</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={!!editingDept} onOpenChange={(open) => !open && setEditingDept(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUpdateSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="size-5 text-purple-600" />
                <span>Edit Department Details</span>
              </DialogTitle>
              <DialogDescription>
                Update the official name or scope of responsibilities for this department.
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
                  Department Name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Description & Scope</label>
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
                onClick={() => setEditingDept(null)}
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
