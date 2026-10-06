import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, FileText, CheckCircle } from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy | Butuan Report",
  description: "Privacy Policy and Data Protection standards for Butuan City Report System",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <LandingHeader />

      <main className="flex-1 container mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-16 space-y-8">
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
            <Shield className="size-3.5" />
            <span>Data Protection & Privacy Policy</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Privacy Policy & Data Handling
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground leading-relaxed">
            The City Government of Butuan is committed to protecting citizen privacy and ensuring transparent handling of civic data in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173).
          </p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-foreground">
          {/* Section 1 */}
          <Card className="border-border/70 p-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Eye className="size-4 text-primary" />
              1. Information We Collect
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              When filing civic incident reports through Butuan Report, we collect:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-muted-foreground space-y-1.5">
              <li><strong>Account Credentials:</strong> Full name, email address, and authentication identifiers verified via Clerk authentication.</li>
              <li><strong>Incident Data:</strong> Report title, description, category, severity rating, barangay location, street area, landmark, and optional GPS coordinates.</li>
              <li><strong>Evidence Files:</strong> Uploaded photo or document attachments strictly relevant to reported hazards.</li>
              <li><strong>Audit Identifiers:</strong> System interaction timestamps logged for security and operational audit purposes.</li>
            </ul>
          </Card>

          {/* Section 2 */}
          <Card className="border-border/70 p-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Lock className="size-4 text-primary" />
              2. How We Use Your Data
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Collected information is processed solely for municipal dispatch and public safety operations:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-muted-foreground space-y-1.5">
              <li>Triage and verification of reported civic hazards by municipal dispatchers (CDRRMO, CEO, City ENRO, CHO, CGSO).</li>
              <li>Assignment to authorized field response units for incident resolution.</li>
              <li>Dispatching real-time progress notifications and workflow status updates back to reporting residents.</li>
              <li>Generating aggregated statistical indicators for urban planning and municipal safety improvements.</li>
            </ul>
          </Card>

          {/* Section 3 */}
          <Card className="border-border/70 p-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              3. Data Security & Storage Controls
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              We enforce multi-layered cryptographic and administrative controls:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-muted-foreground space-y-1.5">
              <li><strong>Row Level Security (RLS):</strong> Database-level policies ensure residents can only access their own reports and public timeline updates.</li>
              <li><strong>Private Object Storage:</strong> Photo and document attachments are stored in non-public storage buckets with expiring, signed access links.</li>
              <li><strong>Append-Only Audit Logs:</strong> Security audit logs are immutable and accessible exclusively to authorized administrators.</li>
              <li><strong>Role-Based Access Control:</strong> Field responders only view incidents explicitly assigned to their department.</li>
            </ul>
          </Card>

          {/* Section 4 */}
          <Card className="border-border/70 p-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <CheckCircle className="size-4 text-primary" />
              4. Citizen Data Rights & Contact
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Under Republic Act 10173, citizens retain the right to request information, inspect active records, and request correction of incorrect personal profile details. For privacy queries:
            </p>
            <div className="bg-muted/40 p-4 rounded-xl border border-border text-xs space-y-1">
              <p className="font-semibold text-foreground">Butuan City Data Protection Officer</p>
              <p className="text-muted-foreground">City Hall Compound, J. Rosales Ave, Butuan City, Agusan del Norte</p>
              <p className="text-muted-foreground">Email: <span className="font-mono text-primary underline">dataprivacy@butuan.gov.ph</span></p>
            </div>
          </Card>
        </div>

        <div className="pt-4 flex justify-between items-center text-xs text-muted-foreground border-t border-border/60">
          <span>© 2026 City Government of Butuan</span>
          <Link href="/terms" className="text-primary font-medium hover:underline">
            View Terms of Service &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
