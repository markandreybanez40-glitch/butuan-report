"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UserCheck,
  Calendar,
  History,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import {
  getIncidentAssignmentHistoryAction,
  type AssignmentHistoryItem,
} from "@/app/admin/actions";

interface AssignmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidentId: string | null;
  reportNumber: string;
  incidentTitle: string;
}

export function AssignmentHistoryModal({
  isOpen,
  onClose,
  incidentId,
  reportNumber,
  incidentTitle,
}: AssignmentHistoryModalProps) {
  const [history, setHistory] = useState<AssignmentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && incidentId) {
      setIsLoading(true);
      setErrorMsg(null);

      getIncidentAssignmentHistoryAction(incidentId)
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.assignments) {
            setHistory(res.assignments);
          } else {
            setErrorMsg(res.error || "Failed to load assignment history.");
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          console.error("Error loading assignment history:", err);
          setErrorMsg("Failed to connect to server.");
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      setHistory([]);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, incidentId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-3 border-b border-border/70 bg-muted/20">
          <DialogTitle className="flex items-center gap-2 text-base">
            <History className="size-5 text-blue-600 dark:text-blue-400" />
            <span>Assignment History Trail</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Complete audit trail of departmental dispatches and responder assignments for{" "}
            <strong className="text-foreground font-mono">{reportNumber}</strong> (&quot;{incidentTitle}&quot;).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-blue-600" />
              <p className="text-xs">Loading assignment records...</p>
            </div>
          ) : errorMsg ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-xs italic">
              No assignment history recorded for this report.
            </div>
          ) : (
            <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
              {history.map((item, idx) => {
                const isCurrent = item.unassigned_at === null;
                const assignedDateStr = new Date(item.assigned_at).toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const unassignedDateStr = item.unassigned_at
                  ? new Date(item.unassigned_at).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : null;

                return (
                  <div key={item.id || idx} className="relative pl-8 space-y-1">
                    <div
                      className={`absolute left-2 top-2 size-3.5 rounded-full border-2 border-background ${
                        isCurrent ? "bg-emerald-500" : "bg-muted-foreground/50"
                      }`}
                    />

                    <div
                      className={`p-3 rounded-xl border text-xs space-y-2 ${
                        isCurrent
                          ? "bg-card border-emerald-500/30 shadow-2xs"
                          : "bg-muted/20 border-border/60 text-muted-foreground"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">
                            {item.department?.name || "Unassigned Agency"}
                          </span>
                          {isCurrent ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 font-semibold"
                            >
                              Active Assignment
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-muted-foreground">
                              Past / Reassigned
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                          <Calendar className="size-3" />
                          <span>{assignedDateStr}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/40">
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Assigned Responder:</span>
                          <span className="font-semibold text-foreground flex items-center gap-1">
                            <UserCheck className="size-3 text-blue-500" />
                            {item.field_responder || item.assigned_user?.full_name || "Department General Pool"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Assigned By:</span>
                          <span className="text-foreground">
                            {item.assigner?.full_name || "System Admin"} ({item.assigner?.role?.toUpperCase() || "ADMIN"})
                          </span>
                        </div>
                        {item.instruction && (
                          <div className="col-span-full pt-0.5">
                            <span className="text-muted-foreground block text-[10px]">Internal Dispatch Instruction:</span>
                            <Badge variant="outline" className="text-[10px] mt-0.5 bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 font-medium">
                              {item.instruction}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {unassignedDateStr && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1 font-mono">
                          <Clock className="size-2.5" />
                          <span>Unassigned on: {unassignedDateStr}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border/70 bg-muted/20 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
