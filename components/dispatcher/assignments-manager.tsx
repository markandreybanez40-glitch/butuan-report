"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Clock,
  MapPin,
  ArrowRight,
  Inbox,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IncidentStatusBadge, IncidentSeverityBadge } from "@/components/dashboard/status-badge";
import { AssignmentForm } from "@/components/staff/staff-action-forms";
import { cn } from "@/lib/utils";
import type { Department } from "@/types";
import type { StaffIncidentListItem } from "@/lib/data/staff";

interface AssignmentsManagerProps {
  unassignedIncidents: StaffIncidentListItem[];
  assignedIncidents: StaffIncidentListItem[];
  departments: Department[];
  staffMembers: { id: string; full_name: string; role: string; phone: string | null }[];
}

export function AssignmentsManager({
  unassignedIncidents,
  assignedIncidents,
  departments,
  staffMembers,
}: AssignmentsManagerProps) {
  const [selectedIncident, setSelectedIncident] = useState<StaffIncidentListItem | null>(null);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/70 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Unassigned Queue
            </CardTitle>
            <Clock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {unassignedIncidents.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Reports awaiting department routing
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Active Assignments
            </CardTitle>
            <UserCheck className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              {assignedIncidents.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Currently assigned to responders / teams
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Available Responders
            </CardTitle>
            <Building2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {staffMembers.filter((s) => s.role === "responder").length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Active field response personnel
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Unassigned Triage Board */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Unassigned Incident Queue ({unassignedIncidents.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Triage and route incoming citizen hazard submissions to responsible municipal units
            </p>
          </div>
        </div>

        {unassignedIncidents.length === 0 ? (
          <Card className="border-dashed p-8 text-center bg-card/50">
            <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="size-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">All incidents have been assigned!</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-0.5">
              Great job! All incoming citizen reports have been routed to response agencies.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unassignedIncidents.map((incident) => {
              const dateStr = new Date(incident.created_at).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={incident.id}
                  className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-2xs hover:border-amber-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          {incident.report_number}
                        </span>
                        <IncidentStatusBadge status={incident.status} />
                        <IncidentSeverityBadge severity={incident.severity} />
                      </div>
                      <h4 className="text-sm font-bold text-foreground line-clamp-1">
                        {incident.title}
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {incident.description}
                  </p>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 truncate">
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate">{incident.barangay}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/70">• {dateStr}</span>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setSelectedIncident(incident)}
                      className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-2.5 font-semibold gap-1 shrink-0 shadow-2xs"
                    >
                      <span>Assign Unit</span>
                      <ArrowRight className="size-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Active Assignments List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Active Dispatches ({assignedIncidents.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Incidents currently under investigation or in-progress by response units
            </p>
          </div>
        </div>

        {assignedIncidents.length === 0 ? (
          <Card className="border-dashed p-8 text-center bg-card/50">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground mb-2">
              <Inbox className="size-5" />
            </div>
            <p className="text-xs text-muted-foreground">No active dispatches right now.</p>
          </Card>
        ) : (
          <div className="rounded-xl border border-border/70 bg-card divide-y divide-border/60 overflow-hidden shadow-2xs">
            {assignedIncidents.map((incident) => {
              const activeAssignment = incident.assignments?.find((a) => a.unassigned_at === null);
              const deptName = activeAssignment?.department?.name || "Department Not Set";
              const responderName = activeAssignment?.assigned_user?.full_name || "Unassigned Officer";

              return (
                <div
                  key={incident.id}
                  className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                        {incident.report_number}
                      </span>
                      <IncidentStatusBadge status={incident.status} />
                      <IncidentSeverityBadge severity={incident.severity} />
                      {incident.category && (
                        <Badge variant="outline" className="text-[10px] py-0">
                          {incident.category.name}
                        </Badge>
                      )}
                    </div>

                    <Link
                      href={`/dispatcher/reports/${incident.id}`}
                      className="text-sm font-semibold text-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors truncate block"
                    >
                      {incident.title}
                    </Link>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3 text-muted-foreground" />
                        <span>{incident.barangay}</span>
                      </span>
                      <span className="flex items-center gap-1 text-foreground font-medium">
                        <Building2 className="size-3 text-amber-600 dark:text-amber-400" />
                        <span>{deptName}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <UserCheck className="size-3 text-blue-500" />
                        <span>{responderName}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIncident(incident)}
                      className="h-8 text-xs rounded-lg gap-1"
                    >
                      <span>Reassign</span>
                    </Button>
                    <Link
                      href={`/dispatcher/reports/${incident.id}`}
                      className={cn(buttonVariants({ size: "sm" }), "h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded-lg gap-1")}
                    >
                      <span>Details</span>
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Reassignment Modal Dialog */}
      <Dialog open={!!selectedIncident} onOpenChange={(open) => !open && setSelectedIncident(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Assign Incident: {selectedIncident?.report_number}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select the responsible municipal department and field officer to dispatch.
            </DialogDescription>
          </DialogHeader>

          {selectedIncident && (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1">
                <p className="font-bold text-foreground">{selectedIncident.title}</p>
                <p className="text-muted-foreground">
                  Location: {selectedIncident.barangay}
                  {selectedIncident.landmark ? ` (${selectedIncident.landmark})` : ""}
                </p>
              </div>

              <AssignmentForm
                incidentId={selectedIncident.id}
                departments={departments}
                staffMembers={staffMembers}
                currentDepartmentId={
                  selectedIncident.assignments?.find((a) => a.unassigned_at === null)?.department_id || null
                }
                currentResponderId={
                  selectedIncident.assignments?.find((a) => a.unassigned_at === null)?.assigned_user_id || null
                }
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
