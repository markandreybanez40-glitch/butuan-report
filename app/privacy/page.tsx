import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  FileText,
  CheckCircle,
  Database,
  Trash2,
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy | Butuan Report",
  description: "Comprehensive privacy policy, data protection standards, and user rights for Butuan Report",
};

export default function PrivacyPolicyPage() {
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
            Last Updated: October 2026
          </span>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Shield className="size-3.5" />
            <span>Data Protection & Privacy Governance</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground leading-relaxed">
            This Privacy Policy explains how Butuan Report collects, processes, stores, and protects personal and incident data in accordance with Republic Act No. 10173 (Data Privacy Act of 2012) and responsible data governance standards.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-sm leading-relaxed text-foreground">
          {/* Section 1: Information Collected */}
          <Card className="border-border/70 p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Eye className="size-4 text-primary" />
              1. What Information We Collect
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              We collect only the minimum necessary information required to authenticate citizen accounts, verify reported hazards, and coordinate dispatch responses:
            </p>
            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-1 text-xs">
                <span className="font-semibold text-foreground block">Account & Profile Data</span>
                <p className="text-muted-foreground">
                  Full name, email address, phone number (optional), and registered barangay collected during authentication and profile creation.
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-1 text-xs">
                <span className="font-semibold text-foreground block">Incident & Location Data</span>
                <p className="text-muted-foreground">
                  Report title, description, category, severity rating, barangay name, street/area, nearby landmark, and optional device GPS coordinates.
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-1 text-xs">
                <span className="font-semibold text-foreground block">Media & Attachments</span>
                <p className="text-muted-foreground">
                  Photographic evidence or documents voluntarily uploaded by residents to document hazards or physical conditions.
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-1 text-xs">
                <span className="font-semibold text-foreground block">System Logs & Timestamps</span>
                <p className="text-muted-foreground">
                  Timestamps of report submissions, administrative status changes, and operational dispatches for audit integrity.
                </p>
              </div>
            </div>
          </Card>

          {/* Section 2: Why We Collect It & How It Is Used */}
          <Card className="border-border/70 p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Database className="size-4 text-primary" />
              2. Why We Collect It and How It Is Used
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Information collected through Butuan Report is used exclusively for civic and municipal public safety operations:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-muted-foreground space-y-2">
              <li>
                <strong>Incident Triage & Verification:</strong> Enabling dispatchers to evaluate the validity, urgency, and geographical location of reported civic hazards.
              </li>
              <li>
                <strong>Departmental Routing:</strong> Assigning reports to relevant municipal units (e.g., CDRRMO, City Engineering Office, City ENRO, CHO, CGSO) and field responders.
              </li>
              <li>
                <strong>Progress Notification:</strong> Delivering real-time status updates and milestone notices back to the reporting resident.
              </li>
              <li>
                <strong>Community Hazard Awareness:</strong> Displaying anonymized, non-sensitive hazard locations on the public/resident incident map without exposing the reporter&apos;s personal identity.
              </li>
              <li>
                <strong>Civic Planning & Analytics:</strong> Aggregating incident metrics across barangays to help optimize infrastructure maintenance and resource allocation.
              </li>
            </ul>
          </Card>

          {/* Section 3: Data Security & Privacy Controls */}
          <Card className="border-border/70 p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Lock className="size-4 text-primary" />
              3. Security & Privacy Safeguards
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              We employ strict technical and organizational safeguards to protect your personal information:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-muted-foreground space-y-2">
              <li>
                <strong>Database Row-Level Security (RLS):</strong> Cryptographically verified policies enforce strict data isolation. Residents can only query and view their own personal reports and notifications.
              </li>
              <li>
                <strong>Private Attachment Storage:</strong> Photo evidence is kept in private object storage. Files are accessible only to the submitting resident and authorized municipal responders via short-lived, signed tokens.
              </li>
              <li>
                <strong>Strict Identity Shielding:</strong> Public incident maps and public timelines never reveal the reporter&apos;s full name, email, phone number, internal notes, or responder assignments.
              </li>
              <li>
                <strong>Immutable Audit Logging:</strong> Administrative role changes, department reassignments, and status modifications are recorded in an append-only audit ledger.
              </li>
            </ul>
          </Card>

          {/* Section 4: Data Retention & Deletion Principles */}
          <Card className="border-border/70 p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Trash2 className="size-4 text-primary" />
              4. Data Retention & Deletion Principles
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              We adhere to proportionality and purpose-limitation principles:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-muted-foreground space-y-2">
              <li>
                <strong>Active Reports:</strong> Retained while the incident is under review, assigned, in progress, or undergoing resolution.
              </li>
              <li>
                <strong>Resolved & Closed Reports:</strong> Archived securely for historical reference, audit compliance, and municipal analytics.
              </li>
              <li>
                <strong>Account Deletion:</strong> Residents may request the closure of their profile. Associated personal contact data will be decoupled from past incident records, preserving historical hazard statistics while protecting individual identity.
              </li>
            </ul>
          </Card>

          {/* Section 5: User Rights Under RA 10173 */}
          <Card className="border-border/70 p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <CheckCircle className="size-4 text-primary" />
              5. Citizen Data Rights
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              In accordance with the Data Privacy Act of 2012, citizens have the following statutory rights:
            </p>
            <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground pt-1">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                <strong className="text-foreground block mb-1">Right to Be Informed</strong>
                Know how your personal data is collected, handled, and used by the system.
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                <strong className="text-foreground block mb-1">Right to Access</strong>
                View and review all personal incident reports and account profile data.
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                <strong className="text-foreground block mb-1">Right to Rectification</strong>
                Request correction of inaccurate, outdated, or incomplete profile records.
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                <strong className="text-foreground block mb-1">Right to File Complaints</strong>
                Lodge privacy inquiries or complaints regarding the processing of your data.
              </div>
            </div>
          </Card>

          {/* Section 6: Contact & Inquiries */}
          <Card className="border-border/70 p-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              6. Privacy Contact & Data Protection Officer
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              For inquiries regarding this policy, to exercise your data subject rights, or to submit a privacy concern, please contact:
            </p>
            <div className="bg-muted/40 p-4 rounded-xl border border-border text-xs space-y-1.5">
              <p className="font-semibold text-foreground">Data Protection Officer — Butuan Report</p>
              <p className="text-muted-foreground">City Government of Butuan, Agusan del Norte, Philippines 8600</p>
              <p className="text-muted-foreground">
                Email: <span className="font-mono text-primary underline">dataprivacy@butuan.gov.ph</span>
              </p>
              <p className="text-muted-foreground">
                Support Portal: <Link href="/contact" className="text-primary hover:underline">Support & Contact Page</Link>
              </p>
            </div>
          </Card>
        </div>

        {/* Footer Navigation */}
        <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground border-t border-border/60">
          <span>© 2026 Butuan Report. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/data-collection" className="hover:text-foreground transition-colors">
              Data Collection
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
