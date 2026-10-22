"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Building2, UserCheck, Loader2, AlertCircle, Truck } from "lucide-react";
import { adminAssignIncidentAction } from "@/app/admin/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FIELD_RESPONDERS,
  DISPATCH_VEHICLES,
  type Department,
  type FieldResponder,
  type DispatchVehicle,
} from "@/types";

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  incidentId: string | null;
  reportNumber: string;
  incidentTitle: string;
  currentDepartmentId: string | null;
  currentResponderId: string | null;
  currentFieldResponder?: string | null;
  currentDispatchVehicle?: string | null;
  departments: Department[];
  staffMembers?: {
    id: string;
    full_name: string;
    role: string;
    phone: string | null;
    department_id?: string | null;
    department?: { id: string; name: string } | null;
  }[];
}

export function AssignModal({
  isOpen,
  onClose,
  onSuccess,
  incidentId,
  reportNumber,
  incidentTitle,
  currentDepartmentId,
  currentResponderId,
  currentFieldResponder,
  currentDispatchVehicle,
  departments,
}: AssignModalProps) {
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedFieldResponder, setSelectedFieldResponder] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [assignmentNote, setAssignmentNote] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      setSelectedDeptId(currentDepartmentId || "");
      setSelectedFieldResponder(currentFieldResponder || "");
      setSelectedVehicle(currentDispatchVehicle || "");
      setAssignmentNote("");
      setErrorMsg(null);
    }
  }, [isOpen, currentDepartmentId, currentFieldResponder, currentDispatchVehicle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentId) return;

    if (!selectedDeptId && !selectedFieldResponder && !selectedVehicle) {
      setErrorMsg("Please select at least a department, field responder, or dispatch vehicle.");
      return;
    }

    if (selectedFieldResponder && !FIELD_RESPONDERS.includes(selectedFieldResponder as FieldResponder)) {
      setErrorMsg("Please select a valid responder from Responder 1–5.");
      return;
    }

    if (selectedVehicle && !DISPATCH_VEHICLES.includes(selectedVehicle as DispatchVehicle)) {
      setErrorMsg("Please select a valid dispatch vehicle from Vehicle 1–5.");
      return;
    }

    setErrorMsg(null);

    startTransition(async () => {
      const res = await adminAssignIncidentAction({
        incidentId,
        departmentId: selectedDeptId || null,
        fieldResponder: (selectedFieldResponder as FieldResponder) || null,
        dispatchVehicle: (selectedVehicle as DispatchVehicle) || null,
        assignmentNote: assignmentNote.trim() || undefined,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || "Failed to assign incident. Please try again.");
      }
    });
  };

  const isReassign = Boolean(currentDepartmentId || currentResponderId || currentFieldResponder);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Building2 className="size-5 text-blue-600 dark:text-blue-400" />
              <span>{isReassign ? "Reassign Incident Report" : "Assign Incident Report"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign responsible municipal response agency and designate a field responder for{" "}
              <strong className="text-foreground font-mono">{reportNumber}</strong> (&quot;{incidentTitle}&quot;).
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3.5 text-xs">
            {/* Department Select */}
            <div className="space-y-1.5">
              <Label htmlFor="assign-department" className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                <Building2 className="size-3.5 text-muted-foreground" />
                <span>Responsible Department / Agency</span>
              </Label>
              <select
                id="assign-department"
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                disabled={isPending}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs sm:text-sm font-medium shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
              >
                <option value="">-- Select Department --</option>
                {departments
                  .filter((d) => d.is_active)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Field Responder Select (Responder 1–5 only) */}
            <div className="space-y-1.5">
              <Label htmlFor="assign-field-responder" className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                <UserCheck className="size-3.5 text-blue-600 dark:text-blue-400" />
                <span>Field Responder</span>
              </Label>
              <select
                id="assign-field-responder"
                value={selectedFieldResponder}
                onChange={(e) => setSelectedFieldResponder(e.target.value)}
                disabled={isPending}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs sm:text-sm font-medium shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
              >
                <option value="">-- Select Responder (Responder 1–5) --</option>
                {FIELD_RESPONDERS.map((responder) => (
                  <option key={responder} value={responder}>
                    {responder}
                  </option>
                ))}
              </select>
            </div>

            {/* Dispatch Vehicle Select (Vehicle 1–5 only) */}
            <div className="space-y-1.5">
              <Label htmlFor="assign-dispatch-vehicle" className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                <Truck className="size-3.5 text-blue-600 dark:text-blue-400" />
                <span>Dispatch Vehicle</span>
              </Label>
              <Select
                value={selectedVehicle || null}
                onValueChange={(val) => setSelectedVehicle((val as string) || "")}
                disabled={isPending}
              >
                <SelectTrigger
                  id="assign-dispatch-vehicle"
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs sm:text-sm font-medium shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 justify-between"
                >
                  <SelectValue placeholder="-- Select Dispatch Vehicle (Vehicle 1–5) --" />
                </SelectTrigger>
                <SelectContent>
                  {DISPATCH_VEHICLES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional Remarks */}
            <div className="space-y-1.5">
              <Label htmlFor="assign-note" className="font-semibold text-foreground block text-xs">
                Internal Remarks / Priority Notes (Optional)
              </Label>
              <Textarea
                id="assign-note"
                value={assignmentNote}
                onChange={(e) => setAssignmentNote(e.target.value)}
                disabled={isPending}
                rows={2}
                placeholder="Special dispatch guidelines or response timeline..."
                className="text-xs bg-background"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Saving Assignment...</span>
                </>
              ) : (
                <span>{isReassign ? "Confirm Reassignment" : "Confirm Assignment"}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
