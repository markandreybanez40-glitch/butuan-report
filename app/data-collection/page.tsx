import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Database,
  UserCheck,
  FileSpreadsheet,
  Users,
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Data Collection Transparency | Butuan Report",
  description: "Detailed breakdown of data collected, optional vs required fields, and access policies for Butuan Report",
};

export default function DataCollectionPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <LandingHeader />

      <main className="flex-1 container mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-16 space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-5">
          <Link
            href="/"
            className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Return to Home</span>
          </Link>

          <span className="text-xs font-mono text-muted-foreground">
            Effective: October 2026
          </span>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Database className="size-3.5" />
            <span>Transparency & Data Disclosure</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Data Collection & Usage Transparency
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground leading-relaxed">
            We believe in complete transparency regarding the information collected from citizens, why each data point is needed, and who has authorized access.
          </p>
        </div>

        {/* Content Breakdown */}
        <div className="space-y-6 text-sm leading-relaxed text-foreground">
          {/* Section 1: Registration Data */}
          <Card className="border-border/70 p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <UserCheck className="size-4 text-primary" />
              1. Citizen Registration & Profile Data
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              When registering an account via Clerk authentication, the following profile attributes are established:
            </p>

            <div className="space-y-3 pt-1">
              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-xs sm:text-sm">
                    Full Name & Email Address
                  </span>
                  <Badge variant="default" className="text-[10px]">
                    Required
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Purpose:</strong> Identifies the account holder, prevents fraudulent anonymous spam, and enables report status update notifications.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-xs sm:text-sm">
                    Contact Phone Number
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Optional
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Purpose:</strong> Enables municipal field responders to contact the reporter for urgent location clarifications during emergency dispatch.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-xs sm:text-sm">
                    Registered Barangay
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Optional
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Purpose:</strong> Pre-fills resident location preferences and helps aggregate neighborhood statistics.
                </p>
              </div>
            </div>
          </Card>

          {/* Section 2: Incident Submission Data */}
          <Card className="border-border/70 p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="size-4 text-primary" />
              2. Incident Report Submission Data
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              When filing a civic report at <Link href="/dashboard/submit-report" className="text-primary hover:underline">/dashboard/submit-report</Link>, the following fields are collected:
            </p>

            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-foreground">Category & Title</strong>
                  <Badge variant="default" className="text-[9px] py-0 px-1">Required</Badge>
                </div>
                <p className="text-muted-foreground">
                  Classifies the hazard (e.g., Road Damage, Flooding) to route it to the proper department.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-foreground">Barangay Location</strong>
                  <Badge variant="default" className="text-[9px] py-0 px-1">Required</Badge>
                </div>
                <p className="text-muted-foreground">
                  Designates the specific jurisdiction among Butuan&apos;s 86 barangays.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-foreground">Description & Details</strong>
                  <Badge variant="default" className="text-[9px] py-0 px-1">Required</Badge>
                </div>
                <p className="text-muted-foreground">
                  Narrative description explaining the obstruction, danger, or physical hazard.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-foreground">Severity Rating</strong>
                  <Badge variant="default" className="text-[9px] py-0 px-1">Required</Badge>
                </div>
                <p className="text-muted-foreground">
                  Citizen-assessed urgency (Low, Medium, High, Critical) for prioritization.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-foreground">Landmark / Street Area</strong>
                  <Badge variant="outline" className="text-[9px] py-0 px-1">Optional</Badge>
                </div>
                <p className="text-muted-foreground">
                  Physical cues or street names that guide response vehicles to the exact scene.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-foreground">GPS Coordinates</strong>
                  <Badge variant="outline" className="text-[9px] py-0 px-1">Optional</Badge>
                </div>
                <p className="text-muted-foreground">
                  Exact latitude/longitude coordinates acquired via device geolocation with user permission.
                </p>
              </div>

              <div className="sm:col-span-2 rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-foreground">Photographic Evidence</strong>
                  <Badge variant="outline" className="text-[9px] py-0 px-1">Optional</Badge>
                </div>
                <p className="text-muted-foreground">
                  Images or documents attached to substantiate the report. Stored in encrypted private storage accessible only via signed tokens.
                </p>
              </div>
            </div>
          </Card>

          {/* Section 3: Who Can Access Data */}
          <Card className="border-border/70 p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Users className="size-4 text-primary" />
              3. Who Can Access Your Data
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Access to data is strictly segmented by operational role and enforced by database Row Level Security:
            </p>

            <div className="space-y-3 pt-1 text-xs">
              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/30 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">The Submitting Resident</Badge>
                  <span className="font-semibold text-foreground">Full Personal Access</span>
                </div>
                <p className="text-muted-foreground">
                  Can view their full report details, attached evidence, and official public progress milestones.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/30 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Dispatchers & Admins</Badge>
                  <span className="font-semibold text-foreground">Operational Triage</span>
                </div>
                <p className="text-muted-foreground">
                  Authorized to review submitted reports, contact details, coordinates, and assign responsible municipal departments.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/30 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Assigned Responders</Badge>
                  <span className="font-semibold text-foreground">Field Operations</span>
                </div>
                <p className="text-muted-foreground">
                  Can access only the incidents specifically assigned to their department or operating unit.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/30 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">General Public / Map Viewers</Badge>
                  <span className="font-semibold text-foreground">Anonymized Safety Information</span>
                </div>
                <p className="text-muted-foreground">
                  Can view only anonymized hazard categories, general barangay location, and resolution status on public maps. Personal identity and contact details are NEVER exposed.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer Navigation */}
        <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground border-t border-border/60">
          <span>© 2026 Butuan Report. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact & Support
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
