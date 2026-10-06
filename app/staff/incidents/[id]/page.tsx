import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Compass,
  FileText,
  Lock,
  MapPin,
  Paperclip,
  ShieldAlert,
  User,
  ExternalLink,
  Building,
  UserCheck,
  Phone,
} from "lucide-react";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getStaffIncidentDetails, getAssignableStaff } from "@/lib/data/staff";
import { getActiveDepartments } from "@/lib/data/departments";
import { StaffHeader } from "@/components/staff/staff-header";
import { IncidentStatusBadge, IncidentSeverityBadge } from "@/components/dashboard/status-badge";
import {
  StatusUpdateForm,
  AssignmentForm,
  AddUpdateForm,
} from "@/components/staff/staff-action-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserRole, IncidentStatus } from "@/types";

interface StaffIncidentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manage Incident | Butuan Report",
  description: "Incident details, dispatch management, updates, and internal notes",
};

export default async function StaffIncidentDetailPage({ params }: StaffIncidentDetailPageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const incident = await getStaffIncidentDetails(id, profile);

  if (!incident) {
    return (
      <>
        <StaffHeader title="Incident Not Found" role={profile.role as UserRole} />
        <main className="flex-1 p-6 lg:p-12 max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-4">
          <div className="size-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <ShieldAlert className="size-7 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Access Restricted or Not Found</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            This incident could not be found, or as a field responder, you are not authorized to view tickets that are not assigned to your unit.
          </p>
          <Link
            href="/staff/incidents"
            className={cn(buttonVariants({ size: "sm" }), "rounded-full text-xs")}
          >
            Return to Incident Queue
          </Link>
        </main>
      </>
    );
  }

  const departments = await getActiveDepartments();
  const staffMembers = await getAssignableStaff();

  const activeAssignment = incident.assignments.find((a) => a.unassigned_at === null);

  const formattedCreated = new Date(incident.created_at).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedResolved = incident.resolved_at
    ? new Date(incident.resolved_at).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const isDispatcherOrAdmin = ["dispatcher", "admin"].includes(profile.role);

  return (
    <>
      <StaffHeader
        title={`Manage: ${incident.report_number}`}
        subtitle={`Reported on ${formattedCreated} in ${incident.barangay}`}
        role={profile.role as UserRole}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Navigation back and header metadata */}
        <div className="space-y-3">
          <Link
            href="/staff/incidents"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Incident Queue</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-extrabold text-primary">
                  {incident.report_number}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-xs font-medium text-muted-foreground">
                  {incident.category?.name || "General Hazard"}
                </span>
                <IncidentSeverityBadge severity={incident.severity} />
                <IncidentStatusBadge status={incident.status} />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                {incident.title}
              </h2>
            </div>

            {/* Quick status pills */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
              {formattedResolved && (
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-medium py-1 px-3">
                  Resolved on {formattedResolved}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs bg-muted/40 font-medium py-1 px-3">
                Assigned: {activeAssignment?.department?.name || activeAssignment?.assigned_user?.full_name || "Unassigned"}
              </Badge>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column (2 Cols): Details, Location, Evidence, and Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  Incident Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {incident.description}
                </p>

                {/* Reporter information summary */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <User className="size-3.5 text-primary" />
                    <span>Citizen Reporter Profile</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-muted-foreground">
                    <div>
                      <span className="block text-[10px]">Name:</span>
                      <strong className="text-foreground">{incident.reporter?.full_name || "Anonymous Resident"}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px]">Contact:</span>
                      <span className="text-foreground flex items-center gap-1">
                        <Phone className="size-3" />
                        {incident.reporter?.phone || "No phone provided"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px]">Resident Barangay:</span>
                      <span className="text-foreground">{incident.reporter?.barangay || "Butuan City"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location & Coordinates Card */}
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <span className="text-muted-foreground block text-[10px] font-medium">Barangay</span>
                    <span className="font-semibold text-foreground text-sm">{incident.barangay}</span>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <span className="text-muted-foreground block text-[10px] font-medium">Street / Area</span>
                    <span className="font-semibold text-foreground text-sm">
                      {incident.street_area || "Not specified"}
                    </span>
                  </div>
                </div>

                {incident.landmark && (
                  <div className="rounded-lg bg-muted/40 p-3">
                    <span className="text-muted-foreground block text-[10px] font-medium">Prominent Landmark</span>
                    <span className="font-semibold text-foreground">{incident.landmark}</span>
                  </div>
                )}

                {incident.latitude != null && incident.longitude != null && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <Compass className="size-4 text-primary shrink-0" />
                      <span>
                        GPS: {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}
                      </span>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${incident.latitude},${incident.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <span>Open in Google Maps</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Evidence Attachments Card */}
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Paperclip className="size-4 text-primary" />
                  Evidence Attachments ({incident.attachments.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Files stored privately in municipal vault with secure access
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs">
                {incident.attachments.length === 0 ? (
                  <p className="text-muted-foreground py-2 italic text-center">
                    No photo attachments were submitted with this report.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {incident.attachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/30 gap-2 min-w-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="size-3.5 text-muted-foreground shrink-0" />
                          <div className="truncate">
                            <span className="font-medium text-foreground truncate block">
                              {file.original_filename}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {(file.file_size / 1024).toFixed(1)} KB • {file.mime_type}
                            </span>
                          </div>
                        </div>

                        {file.signed_url && (
                          <a
                            href={file.signed_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 bg-background px-2.5 py-1 rounded-md border border-border/70 shadow-2xs"
                          >
                            <span>View</span>
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Updates & Notes Timeline */}
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  Chronological Updates & Notes ({incident.updates.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Combined public notices and staff operational notes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {incident.updates.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center italic">
                    No timeline updates or notes have been logged for this incident yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {incident.updates.map((update) => {
                      const isInternal = update.visibility === "internal";
                      const dateStr = new Date(update.created_at).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={update.id}
                          className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                            isInternal
                              ? "bg-amber-500/5 border-amber-500/30 text-amber-900 dark:text-amber-200"
                              : "bg-muted/30 border-border/60 text-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {isInternal ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-amber-500/15 border-amber-400/40 text-amber-800 dark:text-amber-300 gap-1 font-semibold"
                                >
                                  <Lock className="size-2.5" />
                                  <span>Internal Staff Note</span>
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-blue-500/10 border-blue-400/40 text-blue-700 dark:text-blue-300 font-semibold"
                                >
                                  Public Notice
                                </Badge>
                              )}
                              <span className="font-semibold text-foreground">
                                {update.author?.full_name || "Operations Staff"}
                              </span>
                              {update.author?.role && (
                                <span className="text-[10px] uppercase text-muted-foreground">
                                  ({update.author.role})
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0">{dateStr}</span>
                          </div>

                          <p className="text-xs leading-relaxed whitespace-pre-wrap pl-1">
                            {update.message}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (1 Col): Actions & Controls */}
          <div className="space-y-6">
            {/* 1. Status Update Control */}
            <StatusUpdateForm
              incidentId={incident.id}
              currentStatus={incident.status as IncidentStatus}
              userRole={profile.role as UserRole}
            />

            {/* 2. Department & Responder Assignment Control */}
            {isDispatcherOrAdmin ? (
              <AssignmentForm
                incidentId={incident.id}
                departments={departments}
                staffMembers={staffMembers}
                currentDepartmentId={activeAssignment?.department_id}
                currentResponderId={activeAssignment?.assigned_user_id}
              />
            ) : (
              <Card className="border-border/80 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <UserCheck className="size-4 text-primary" />
                    Assignment Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/40 space-y-1">
                    <span className="text-[10px] text-muted-foreground block font-medium">Department</span>
                    <strong className="text-foreground block">{activeAssignment?.department?.name || "None assigned"}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 space-y-1">
                    <span className="text-[10px] text-muted-foreground block font-medium">Assigned Unit</span>
                    <strong className="text-foreground block">{activeAssignment?.assigned_user?.full_name || "Unassigned"}</strong>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 3. Add Update or Internal Note Form */}
            <AddUpdateForm incidentId={incident.id} />

            {/* 4. Assignment History Card */}
            {incident.assignments.length > 0 && (
              <Card className="border-border/80 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Building className="size-3.5" />
                    Assignment Log ({incident.assignments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  {incident.assignments.map((a) => (
                    <div
                      key={a.id}
                      className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-1"
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-semibold text-foreground">
                          {a.department?.name || "Direct Unit Assignment"}
                        </span>
                        <span className={a.unassigned_at ? "text-muted-foreground" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
                          {a.unassigned_at ? "Relieved" : "Active"}
                        </span>
                      </div>
                      {a.assigned_user && (
                        <p className="text-[11px] text-muted-foreground">
                          Responder: <strong className="text-foreground">{a.assigned_user.full_name}</strong>
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        Assigned by {a.assigner?.full_name || "Dispatcher"} on{" "}
                        {new Date(a.assigned_at).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
