import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getStaffIncidentPaginatedQueue, getAssignableStaff } from "@/lib/data/staff";
import { getActiveDepartments } from "@/lib/data/departments";
import { DispatcherHeader } from "@/components/dispatcher/dispatcher-header";
import { AssignmentsManager } from "@/components/dispatcher/assignments-manager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Assignments Board | Butuan Report Dispatch",
  description: "Manage department routing, responder dispatches, and active workload distribution",
};

export default async function DispatcherAssignmentsPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "dispatcher") {
    redirect("/dashboard");
  }

  const [unassignedResult, assignedResult, departments, staffMembers] = await Promise.all([
    getStaffIncidentPaginatedQueue(profile, { status: "submitted", pageSize: 50 }),
    getStaffIncidentPaginatedQueue(profile, { status: "assigned,in_progress", pageSize: 50 }),
    getActiveDepartments(),
    getAssignableStaff(),
  ]);

  return (
    <>
      <DispatcherHeader
        title="Department & Responder Assignments"
        subtitle="Route unassigned citizen incident reports to responsible municipal departments and field units"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <AssignmentsManager
          unassignedIncidents={unassignedResult.incidents}
          assignedIncidents={assignedResult.incidents}
          departments={departments}
          staffMembers={staffMembers}
        />
      </main>
    </>
  );
}
