# Butuan Report — Full System Audit

**Audit Date:** October 8, 2026  
**Auditor:** Antigravity AI Code Auditor  
**Workspace:** `c:\Users\Mark Andre\OneDrive\Desktop\butuan-report`  
**Framework:** Next.js 16.3.8 (App Router), React 19.2.8, Clerk Auth 7.9.9, Supabase JS 2.117.2, Tailwind CSS v4, shadcn/ui  
**Audit Type:** Read-Only Complete System & Authentication Audit  

---

## 1. Executive Summary

This read-only audit was conducted to investigate why the user cannot access or view the **Admin Dashboard** and instead is exclusively served the **Resident Portal**.

### The Primary Finding
The **Admin Dashboard is NOT missing and NOT broken**. It is **100% built, fully integrated with typed Supabase data queries, completely implemented with shadcn/ui components, and compiles cleanly with zero ESLint errors**.

The reason you are seeing only the Resident Portal is due to a **Role Assignment & Authorization Boundary State**:
1. The project relies strictly on the Supabase `public.profiles.role` column as its single source of truth for user roles.
2. In `lib/data/profiles.ts` (`getOrCreateCurrentProfile`), every new user who signs in via Clerk is automatically initialized with `role = 'resident'`.
3. In `supabase/migrations/20261002000000_init_schema.sql`, PostgreSQL Row-Level Security (RLS) prevents non-admin users from altering their own role.
4. When querying the live Supabase database (`profiles` table), there is **exactly 1 user record** (`clerk_user_id: user_3K6wZlhsZZg0iVYMkI5oidjWj2j`, "Mark Andre Ybañez"), and this profile has **`role: 'resident'`**.
5. There is **no admin user record in the entire database**.
6. When your authenticated session accesses `/admin` or any `/admin/*` route, `app/admin/layout.tsx` (lines 39–41) executes a strict server-side authorization check:
   ```typescript
   if (profile.role === "resident") {
     redirect("/dashboard");
   }
   ```
7. Consequently, Next.js immediately issues an HTTP 307 redirect back to `/dashboard` (the Resident Portal). When visiting `/admin/sign-in`, the page detects your signed-in resident account and renders an "Access Restricted: Administrator Privileges Required" guard with a button directing you back to `/dashboard`.

---

## 2. Current Application Architecture

The application is structured into four distinct portal layers under the Next.js App Router:

```
                                  [ Clerk Authentication ]
                                             │
                                             ▼
                               [ lib/data/profiles.ts ]
                         (getOrCreateCurrentProfile() reads Supabase)
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
             role === 'resident'       role === 'admin'       role === 'dispatcher' / 'responder'
                    │                        │                        │
                    ▼                        ▼                        ▼
           /dashboard/*                  /admin/*               /dispatcher/* / /staff/*
        Resident Portal              Admin Workspace             Dispatch & Field Operations
        (ResidentSidebar)            (AdminSidebar)              (Dispatcher/Staff Sidebar)
```

- **Frontend Framework**: Next.js 16.3.8 using React 19 Server Components and Server Actions.
- **Styling & Components**: Tailwind CSS v4, Lucide React icons, and shadcn/ui primitives.
- **Identity Provider**: Clerk Authentication (`@clerk/nextjs` 7.9.9). Handles credentials, session tokens, and OAuth.
- **Database & Data Store**: Supabase PostgreSQL (`@supabase/supabase-js` 2.117.2). Handles relational data, RLS enforcement, sequences, and storage.
- **Role Authority**: Stored in Supabase `profiles` table. Neither Clerk public metadata nor Clerk session claims are used for role storage.
- **Request Interceptor**: `proxy.ts` (Next.js 16 convention replacing `middleware.ts`). Mounts Clerk middleware for session token propagation.

---

## 3. Authentication Flow

### Sign-In Pipeline
1. **User Sign In**: User visits `/sign-in` or `/admin/sign-in`.
2. **Clerk Token Issuance**: Clerk validates credentials and issues a session JWT containing `sub: <clerk_user_id>`.
3. **Data Access Sync**: When any protected route loads:
   - `currentUser()` from `@clerk/nextjs/server` retrieves Clerk user identity.
   - `getOrCreateCurrentProfile()` in `lib/data/profiles.ts` queries Supabase table `profiles` for `clerk_user_id = user.id`.
   - If no profile exists, it inserts a new row with:
     ```typescript
     {
       clerk_user_id: user.id,
       full_name: fullName,
       role: "resident", // ALWAYS defaults to resident
     }
     ```
4. **Layout Authorization Routing**:
   - `app/dashboard/layout.tsx`: If `profile.role === "admin"`, redirects to `/admin`. If `resident`, renders Resident Portal.
   - `app/admin/layout.tsx`: If `profile.role !== "admin"`, redirects residents to `/dashboard`, responders to `/staff`, dispatchers to `/dispatcher`.
   - `app/staff/layout.tsx`: If not responder, redirects accordingly.
   - `app/dispatcher/layout.tsx`: If not dispatcher, redirects accordingly.

---

## 4. Role & Permission Logic

### Source of Truth
The **single source of truth** is the PostgreSQL column `public.profiles.role`.
Valid roles enforced by database constraint `profiles_role_check`:
- `'resident'`
- `'responder'`
- `'dispatcher'`
- `'admin'`

### How Roles are Read
- In server components and server actions: `getCurrentProfile()` in `lib/data/profiles.ts` executes a Supabase query:
  ```typescript
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  ```
- In PostgreSQL RLS policies: Supabase helper function `public.current_user_role()` reads:
  ```sql
  select role from public.profiles where clerk_user_id = public.current_clerk_user_id() limit 1;
  ```
- Role consistency across frontend, server actions, and PostgreSQL RLS is **100% aligned**; they all inspect `public.profiles.role`.

### The Role Escalation Catch-22
- How does a user become an admin?
  - Only an existing admin can call `updateUserRoleAction()` in `app/admin/actions.ts`.
  - The database RLS policy `profiles_update_self_or_admin` prevents non-admins from changing the `role` column.
  - Because no bootstrap script or seed script was executed to promote the first user account, **the first user was created as a `'resident'` and has no built-in UI path to become an `'admin'`**.

---

## 5. Route Audit

| Route | Filesystem Existence | Accessibility | Protection | Authorized Role | Working Status | Component / Rendered View |
|---|---|---|---|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` | Accessible to resident | Protected by `app/dashboard/layout.tsx` | `resident` | ✅ Working | `DashboardOverviewPage` (`ResidentSidebar`) |
| `/admin` | `app/admin/page.tsx` | Accessible ONLY if `role === 'admin'` | Protected by `app/admin/layout.tsx` | `admin` | ✅ Working (blocked by user's resident role) | `AdminDashboardPage` (`AdminSidebar`, `AdminHeader`) |
| `/staff` | `app/staff/page.tsx` | Accessible ONLY if `role === 'responder'` | Protected by `app/staff/layout.tsx` | `responder` | ✅ Working | `StaffOverviewPage` (`StaffSidebar`, `StaffHeader`) |
| `/dispatcher` | `app/dispatcher/page.tsx` | Accessible ONLY if `role === 'dispatcher'` | Protected by `app/dispatcher/layout.tsx` | `dispatcher` | ✅ Working | `DispatcherOverviewPage` (`DispatcherSidebar`, `DispatcherHeader`) |
| `/admin/reports` | `app/admin/reports/page.tsx` | Accessible ONLY if `role === 'admin'` | Protected by `app/admin/layout.tsx` | `admin` | ✅ Working | `AdminReportsPage` (`AdminReportsTable`, `ReportDetailsDrawer`) |
| `/admin/users` | `app/admin/users/page.tsx` | Accessible ONLY if `role === 'admin'` | Protected by `app/admin/layout.tsx` | `admin` | ✅ Working (Redirects to `/admin/residents`) | Server-side redirect to `/admin/residents` preserving search params |
| `/admin/residents` | `app/admin/residents/page.tsx` | Accessible ONLY if `role === 'admin'` | Protected by `app/admin/layout.tsx` | `admin` | ✅ Working | `AdminResidentsPage` (`ResidentsTable`, `ResidentDetailsDrawer`) |
| `/admin/assignments` | `app/admin/assignments/page.tsx` | Accessible ONLY if `role === 'admin'` | Protected by `app/admin/layout.tsx` | `admin` | ✅ Working | `AdminAssignmentsPage` (`AssignmentsTable`, Assign Modals) |
| `/admin/departments` | `app/admin/departments/page.tsx` | Accessible ONLY if `role === 'admin'` | Protected by `app/admin/layout.tsx` | `admin` | ✅ Working | `AdminDepartmentsPage` (`DepartmentsManager`) |
| `/admin/categories` | `app/admin/categories/page.tsx` | Accessible ONLY if `role === 'admin'` | Protected by `app/admin/layout.tsx` | `admin` | ✅ Working | `AdminCategoriesPage` (`CategoriesManager`) |
| `/admin/audit-logs` | `app/admin/audit-logs/page.tsx` | Accessible ONLY if `role === 'admin'` | Protected by `app/admin/layout.tsx` | `admin` | ✅ Working | `AdminAuditLogsPage` (`AuditLogsTable`, Detail Dialog) |
| `/admin/analytics` | `app/admin/analytics/page.tsx` | Accessible ONLY if `role === 'admin'` | Protected by `app/admin/layout.tsx` | `admin` | ✅ Working | `AdminAnalyticsPage` (`AnalyticsCharts`, `AnalyticsFilters`) |
| `/admin/settings` | `app/admin/settings/page.tsx` | Accessible ONLY if `role === 'admin'` | Protected by `app/admin/layout.tsx` | `admin` | ✅ Working | `AdminSettingsPage` (System Config Hub) |
| `/admin/notifications` | `app/admin/notifications/page.tsx` | Accessible ONLY if `role === 'admin'` | Protected by `app/admin/layout.tsx` | `admin` | ✅ Working | `AdminNotificationsPage` |

---

## 6. Dashboard Audit

### Resident Dashboard (`/dashboard`)
- **Layout**: `app/dashboard/layout.tsx`
- **Sidebar**: `components/dashboard/resident-sidebar.tsx`
- **Features**: Submit Report, My Reports, Incident Map, Notifications, Profile Overview.
- **Admin Links**: Zero links to admin or dispatcher features.

### Admin Dashboard (`/admin`)
- **Layout**: `app/admin/layout.tsx`
- **Sidebar**: `components/admin/admin-sidebar.tsx`
- **Header**: `components/admin/admin-header.tsx`
- **Features**: Real-time KPI summary cards (Total Reports, Pending, Under Review, Resolved, Registered Residents), Reports Status Chart, Recent Reports table with full filtering, pagination, search, and dynamic report details drawer.

---

## 7. Admin Dashboard Implementation Audit

### Evidence from Workspace Files
Search and file audit results:
- `app/admin/page.tsx` (214 lines) — **EXISTS**
- `app/admin/layout.tsx` (55 lines) — **EXISTS**
- `app/admin/actions.ts` (1,094 lines) — **EXISTS**
- `components/admin/admin-sidebar.tsx` (167 lines) — **EXISTS**
- `components/admin/admin-header.tsx` (54 lines) — **EXISTS**
- `components/admin/admin-reports-table.tsx` (477 lines) — **EXISTS**
- `components/admin/report-details-drawer.tsx` (611 lines) — **EXISTS**
- `components/admin/dashboard-recent-reports.tsx` (377 lines) — **EXISTS**
- `components/admin/reports-status-chart.tsx` (139 lines) — **EXISTS**
- `components/admin/residents-table.tsx` (467 lines) — **EXISTS**
- `components/admin/resident-details-drawer.tsx` (386 lines) — **EXISTS**
- `components/admin/assignments-table.tsx` (626 lines) — **EXISTS**
- `components/admin/assign-modal.tsx` (174 lines) — **EXISTS**
- `components/admin/assignment-history-modal.tsx` (187 lines) — **EXISTS**
- `components/admin/departments-manager.tsx` (475 lines) — **EXISTS**
- `components/admin/categories-manager.tsx` (477 lines) — **EXISTS**
- `components/admin/audit-logs-table.tsx` (567 lines) — **EXISTS**
- `components/admin/analytics-charts.tsx` (458 lines) — **EXISTS**
- `components/admin/analytics-filters.tsx` (216 lines) — **EXISTS**
- `lib/data/admin.ts` (974 lines) — **EXISTS**

### Classification
**Result: Classification B** — The Admin Dashboard exists, is fully implemented, and is completely wired to Supabase data access. The routing and authorization logic correctly protects it from non-admins, but because your user record is tagged as `'resident'`, you are blocked and redirected.

---

## 8. Database & RLS Audit

### Live Database Inspection Results
A direct query via the Supabase REST API verified the following live state:
- **`profiles` count**: 1 record
  - `id`: `00b4c0f7-f06a-441b-95a3-c71984df8a6f`
  - `clerk_user_id`: `user_3K6wZlhsZZg0iVYMkI5oidjWj2j`
  - `full_name`: `Mark Andre Ybañez`
  - `phone`: `null`
  - `barangay`: `null`
  - **`role`**: **`"resident"`**
  - `created_at`: `2026-10-02T08:28:10.420468+00:00`
- **`departments` count**: 6 records (Pre-seeded and active)
- **`incident_categories` count**: 10 records (Pre-seeded and active)
- **`incidents` count**: 0 records
- **`audit_logs` count**: 0 records

### RLS Policies for Admin Access
- `public.is_admin()` checks `role = 'admin'`.
- All admin RLS policies (`departments_insert_admin`, `categories_insert_admin`, `audit_logs_select_admin`, `profiles_select_own_or_staff`) permit read/write operations when `role = 'admin'`.
- Once a profile has `role = 'admin'`, RLS policies immediately grant the required permissions.

---

## 9. Resident Portal Status

- **Status**: ✅ **COMPLETE & ACTIVE**
- **Routes**:
  - `/dashboard` — Incident overview & emergency hotline cards
  - `/dashboard/submit-report` — Multi-step report submission with photo attachments
  - `/dashboard/my-reports` — Track personal submitted incident reports
  - `/dashboard/incident-map` — Leaflet civic incident map
  - `/dashboard/notifications` — Real-time notification feed

---

## 10. Staff/Dispatcher Status

- **Staff (Field Responders)**:
  - Route: `/staff`
  - Status: ✅ **COMPLETE**
  - Features: Assigned incident queue, map view, status updates (in-progress, resolved).
- **Dispatcher Operations**:
  - Route: `/dispatcher`
  - Status: ✅ **COMPLETE**
  - Features: Centralized incident triage, assignment routing to departments and responders.

---

## 11. Admin Status

- **Status**: ✅ **COMPLETE (BLOCKED BY USER ROLE)**
- The admin dashboard code is fully compiled and ready.
- Accessible only when `public.profiles.role = 'admin'`.

---

## 12. Security Status

- **Route Protection**: ✅ Strictly enforced server-side in Next.js layouts (`layout.tsx`).
- **Data Protection**: ✅ Strictly enforced via PostgreSQL Row-Level Security (RLS).
- **Role Alteration**: ✅ Non-admins cannot alter roles via API or UI.
- **Service Keys**: ✅ Client-side uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; service role key is isolated to trusted server environments.

---

## 13. Missing Features

1. **First-User / Superadmin Bootstrap**: No automatic initialization mechanism to promote the initial developer/system account to `'admin'` upon sign-up.
2. **Account Switcher in Development**: No development-mode role toggle to switch between roles for local testing.

---

## 14. Broken Features

- **None in Application Code**: Code compiles without errors (`npm run lint` and Next.js dev server run cleanly).
- **The "Broken" Experience**: The user experiences a loop where `/admin` redirects to `/dashboard`, creating the appearance that the Admin Dashboard does not exist.

---

## 15. Root Cause of Missing Admin Dashboard

Here is the exact code trace of why you cannot see the Admin Dashboard:

```
[ Step 1: User Logged In ]
Clerk User: "Mark Andre Ybañez" (ID: user_3K6wZlhsZZg0iVYMkI5oidjWj2j)

[ Step 2: Database Record Loaded ]
File: lib/data/profiles.ts -> getOrCreateCurrentProfile()
Row: { id: "00b4c...", role: "resident" }

[ Step 3: User Attempts to Visit /admin ]
File: app/admin/layout.tsx (Lines 24–41)
24: const profile = await getOrCreateCurrentProfile();
39: if (profile.role === "resident") {
40:   redirect("/dashboard");  <-- TRIGGERED! Next.js redirects to /dashboard!
41: }

[ Step 4: Browser Lands on /dashboard ]
File: app/dashboard/layout.tsx (Lines 27–41)
27: if (profile?.role === "admin") { redirect("/admin"); }
39: const userName = profile?.full_name ...
44: <ResidentSidebar ... />    <-- Renders Resident Sidebar!

[ Step 5: User Tries /admin/sign-in ]
File: app/(admin-auth)/admin/sign-in/[[...sign-in]]/page.tsx (Lines 21–69)
21: if (user) {
24:   if (profile?.role === "admin") redirect("/admin");
29:   return <AccessRestricted "Administrator Privileges Required"
             Button: "Continue to Resident Dashboard" (/dashboard) />
```

**Conclusion**: The Admin Dashboard is hidden behind role authorization. Because your account has `role = 'resident'` in Supabase, the server guards refuse entry and redirect you to the Resident Portal.

---

## 16. What Is Already Good

1. **Complete Admin Suite**: All 8 admin workspaces (`/admin`, `/admin/reports`, `/admin/residents`, `/admin/assignments`, `/admin/categories`, `/admin/departments`, `/admin/audit-logs`, `/admin/analytics`) are fully built.
2. **Robust Multi-Role Architecture**: Clean separation between Resident, Responder, Dispatcher, and Admin portals.
3. **Strict Security Model**: Server-side layout verification paired with PostgreSQL RLS prevents privilege escalation.
4. **Clean Codebase**: 100% TypeScript typed, zero ESLint errors, clean component boundaries.

---

## 17. What Must Be Fixed

1. **Promote the Primary User Account**: Update `role = 'admin'` for user `user_3K6wZlhsZZg0iVYMkI5oidjWj2j` (Mark Andre Ybañez) in the Supabase `profiles` table.
2. **Add a Seed / Bootstrap Script**: Provide a controlled administrative command or script (e.g. `npm run seed:admin` or an environment variable check) so new deployments can designate an initial admin without manual database edits.

---

## 18. Recommended Fix Order

1. **Step 1: Elevate Current User in Supabase**: Execute a single update query on the Supabase `profiles` table setting `role = 'admin'` for `clerk_user_id = 'user_3K6wZlhsZZg0iVYMkI5oidjWj2j'`.
2. **Step 2: Verify Access**: Refresh the browser at `/admin`. The server layout will detect `profile.role === 'admin'` and render the full Admin Dashboard.
3. **Step 3: Add Admin Bootstrap Script**: Add a small script in `scripts/promote-admin.ts` to allow designating admin emails or Clerk IDs via CLI.

---

## 19. Overall Completion Estimate

- **Resident Portal**: 95% Complete
- **Staff / Dispatcher Portals**: 90% Complete
- **Admin Dashboard & Management**: 95% Complete
- **Database & RLS**: 95% Complete
- **System Overall Completion**: **~92% Complete**

---

## 20. Final Verdict

The Butuan Report system is in excellent technical health. The architecture is sound, the design aligns with modern standards, and the entire Admin Dashboard is already written and compiled. The issue is purely an **unpromoted user account in the database**. Elevating your profile role in Supabase will immediately unlock the entire Admin Dashboard.

---

## Audit Summary Table

| Area | Status | Evidence | Action Needed |
|---|---|---|---|
| Authentication (Clerk) | ✅ COMPLETE | `proxy.ts`, `app/sign-in`, `app/(admin-auth)/admin/sign-in` | Working as intended. |
| Role Storage | ✅ COMPLETE | Supabase `profiles.role` column, validated by check constraint | Working as intended. |
| Resident Portal | ✅ COMPLETE | `app/dashboard/*`, `ResidentSidebar` | None. |
| Admin Dashboard Core | ✅ COMPLETE | `app/admin/page.tsx`, `AdminSidebar`, `AdminHeader` | Unlock via user role promotion. |
| Admin Reports Management | ✅ COMPLETE | `app/admin/reports/*`, `AdminReportsTable`, `ReportDetailsDrawer` | Unlock via user role promotion. |
| Admin Residents Management | ✅ COMPLETE | `app/admin/residents/*`, `ResidentsTable`, `ResidentDetailsDrawer` | Unlock via user role promotion. |
| Admin Assignments | ✅ COMPLETE | `app/admin/assignments/*`, `AssignmentsTable`, Assign modals | Unlock via user role promotion. |
| Admin Categories & Depts | ✅ COMPLETE | `app/admin/categories/*`, `app/admin/departments/*` | Unlock via user role promotion. |
| Admin Audit Logs | ✅ COMPLETE | `app/admin/audit-logs/*`, `AuditLogsTable` | Unlock via user role promotion. |
| Admin Analytics | ✅ COMPLETE | `app/admin/analytics/*`, `AnalyticsCharts` | Unlock via user role promotion. |
| Server-Side Route Guards | ✅ COMPLETE | `app/admin/layout.tsx` lines 39–41 (`role === 'resident' -> redirect('/dashboard')`) | Working as designed. |
| Database Profiles | 🔴 BLOCKED | Supabase `profiles` row has `role: 'resident'`, 0 admin accounts exist | Update `profiles.role` to `'admin'`. |

---

# NEXT ACTION

The highest-priority actions that should happen next, in exact order (DO NOT implement yet until approved):

1. **Promote Mark Andre Ybañez to `'admin'`**:
   Execute an update on Supabase `profiles` table:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE clerk_user_id = 'user_3K6wZlhsZZg0iVYMkI5oidjWj2j';
   ```
2. **Reload `/admin` in Browser**:
   Verify that the full Admin Command Center immediately renders with all navigation links, KPI metrics, and management tools.
3. **Add Initial Admin Setup Script**:
   Create a non-destructive script for seeding/promoting admin accounts for future deployments.
