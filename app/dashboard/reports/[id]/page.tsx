import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Paperclip,
  AlertTriangle,
  Compass,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import { getMyIncidentWithDetails } from "@/lib/data/incidents";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { IncidentStatusBadge, IncidentSeverityBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface ReportDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReportDetailsPage({ params }: ReportDetailsPageProps) {
  const { id } = await params;
  const incident = await getMyIncidentWithDetails(id);

  if (!incident) {
    return (
      <>
        <DashboardHeader title="Report Details" />
        <main className="flex-1 p-6 sm:p-12 max-w-4xl mx-auto w-full">
          <Card className="p-10 text-center border-dashed">
            <AlertTriangle className="size-10 text-amber-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-foreground">Report Not Found</h2>
            <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-md mx-auto">
              This incident either does not exist or you do not have permission to view it. Reports are restricted to their submitting residents.
            </p>
            <Link
              href="/dashboard/reports"
              className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
            >
              <ArrowLeft className="mr-1.5 size-4" />
              Return to My Reports
            </Link>
          </Card>
        </main>
      </>
    );
  }

  const formattedCreated = new Date(incident.created_at).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedResolved = incident.resolved_at
    ? new Date(incident.resolved_at).toLocaleDateString("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <>
      <DashboardHeader
        title={`Report ${incident.report_number}`}
        subtitle="Detailed tracking and municipal progress timeline"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/reports"
            className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Back to My Reports</span>
          </Link>

          <span className="font-mono text-xs text-muted-foreground">
            ID: <span className="font-semibold text-foreground">{incident.id}</span>
          </span>
        </div>

        {/* Header Summary Banner */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                {incident.report_number}
              </span>
              <IncidentStatusBadge status={incident.status} />
              <IncidentSeverityBadge severity={incident.severity} />
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              <span>Filed on {formattedCreated}</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {incident.title}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-primary mt-1">
              Category: {incident.category?.name || "Civic Hazard"}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column (2 Cols): Description, Location, and Timeline */}
          <div className="md:col-span-2 space-y-6">
            {/* Description Card */}
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  Incident Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {incident.description}
                </p>
              </CardContent>
            </Card>

            {/* Location Details Card */}
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  Incident Location
                </CardTitle>
                <CardDescription className="text-xs">
                  Accurate municipal coordinates and neighborhood references
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <span className="text-xs text-muted-foreground block font-medium">Barangay</span>
                    <span className="font-semibold text-foreground">{incident.barangay}</span>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-3">
                    <span className="text-xs text-muted-foreground block font-medium">Street / Area</span>
                    <span className="font-semibold text-foreground">
                      {incident.street_area || "Not specified"}
                    </span>
                  </div>
                </div>

                {incident.landmark && (
                  <div className="rounded-lg bg-muted/40 p-3">
                    <span className="text-xs text-muted-foreground block font-medium">Nearby Landmark</span>
                    <span className="font-semibold text-foreground">{incident.landmark}</span>
                  </div>
                )}

                {(incident.latitude != null && incident.longitude != null) && (
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground pt-1">
                    <Compass className="size-3.5 text-primary" />
                    <span>
                      GPS Coordinates: {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Public Status / Update Timeline */}
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  Status & Public Progress Timeline
                </CardTitle>
                <CardDescription className="text-xs">
                  Official progress notifications and verified milestone updates from city responders
                </CardDescription>
              </CardHeader>
              <CardContent>
                {incident.updates.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg p-4">
                    <Clock className="size-6 mx-auto mb-2 text-muted-foreground/60" />
                    <p className="font-medium text-foreground">No updates posted yet</p>
                    <p className="mt-0.5">
                      Your report is recorded in the city queue. As dispatchers review and assign field teams, updates will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {incident.updates.map((update, idx) => (
                      <div key={update.id} className="relative">
                        <div className="absolute -left-6 top-1 size-3 rounded-full bg-primary ring-4 ring-background" />
                        <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              Update #{idx + 1}
                            </span>
                            <span>
                              {new Date(update.created_at).toLocaleDateString("en-PH", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed pt-1">
                            {update.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (1 Col): Key Dates & Attachments */}
          <div className="space-y-6">
            {/* Key Dates Card */}
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Incident Milestones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Submitted</span>
                  <span className="font-medium text-foreground text-right">{formattedCreated}</span>
                </div>

                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Current Status</span>
                  <IncidentStatusBadge status={incident.status} />
                </div>

                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Severity Level</span>
                  <IncidentSeverityBadge severity={incident.severity} />
                </div>

                {formattedResolved && (
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Resolved On</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400 text-right">
                      {formattedResolved}
                    </span>
                  </div>
                )}

                {incident.closed_at && (
                  <div className="flex justify-between pt-1">
                    <span className="text-muted-foreground">Archived / Closed</span>
                    <span className="font-medium text-foreground text-right">
                      {new Date(incident.closed_at).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attachments Card */}
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Paperclip className="size-4 text-primary" />
                  Attached Evidence ({incident.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs">
                {incident.attachments.length === 0 ? (
                  <p className="text-muted-foreground py-2 italic text-center">
                    No photo attachments were included with this report.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {incident.attachments.map((file) => (
                      <li
                        key={file.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/30"
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
                            className="shrink-0 text-[11px] font-medium text-primary hover:underline flex items-center gap-1 ml-2"
                          >
                            <span>View</span>
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Privacy Assurance Notice */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <ShieldAlert className="size-3.5 text-primary" />
                <span>Confidentiality Notice</span>
              </div>
              <p className="leading-relaxed">
                Internal departmental coordination notes and assignment details are restricted to city staff. You will only see verified public updates here.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
