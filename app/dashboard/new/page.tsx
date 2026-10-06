import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { getActiveCategories } from "@/lib/data/categories";
import { getCurrentProfile } from "@/lib/data/profiles";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { NewReportForm } from "@/components/dashboard/new-report-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New Incident Report | Butuan Report",
  description: "Submit a new incident report to Butuan City municipal departments",
};

export default async function NewReportPage() {
  const categories = await getActiveCategories();
  const profile = await getCurrentProfile();

  const defaultBarangay = profile?.barangay || "";

  return (
    <>
      <DashboardHeader
        title="Submit New Incident"
        subtitle="File a civic report to alert Butuan City municipal departments"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl w-full mx-auto">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Emergency Reminder Notice */}
        <aside className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive dark:text-red-300 flex items-start gap-2.5">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>
            <strong>Emergency Reminder:</strong> For immediate threats to life, active fires, or medical crises, do not use this web form. Call national <strong>911</strong> or CDRRMO at <strong>(085) 341-1111</strong> immediately.
          </span>
        </aside>

        {/* Interactive Multi-Section Report Form */}
        <NewReportForm
          categories={categories}
          defaultBarangay={defaultBarangay}
        />
      </main>
    </>
  );
}
