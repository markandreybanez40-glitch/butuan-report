# Production Deployment Guide — Butuan Report

This guide outlines the step-by-step procedure to deploy the **Butuan Report** civic reporting platform to production environments such as Vercel, AWS Amplify, Netlify, or Docker container platforms.

---

## 1. Prerequisites
- **Git Repository**: GitHub, GitLab, or Bitbucket repository containing the codebase.
- **Clerk Account**: Production instance configured in [Clerk Dashboard](https://dashboard.clerk.com).
- **Supabase Account**: Production project provisioned in [Supabase Dashboard](https://supabase.com).
- **Deployment Platform**: Vercel account or container hosting.

---

## 2. Environment Variables

Configure the following environment variables in your deployment hosting platform settings:

| Variable Name | Environment | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Client & Server | Clerk public publishable key |
| `CLERK_SECRET_KEY` | Server Only (Secret) | Clerk server authentication secret |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Client & Server | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Client & Server | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Client & Server | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Client & Server | `/dashboard` |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Supabase project REST URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client & Server | Supabase anonymous public API key |
| `SUPABASE_SECRET_KEY` | Server Only (Secret) | Supabase service-role secret (used for privileged server actions, audit logging & triggers) |
| `INITIAL_ADMIN_CLERK_USER_ID` | Server Only (Optional) | Explicit Clerk user ID of designated system administrator for automated one-time bootstrap |

> ⚠️ **CRITICAL**: Never expose `CLERK_SECRET_KEY` or `SUPABASE_SECRET_KEY` to client-side code or browser bundles.

---

## 3. Database & Storage Initialization

1. Connect to your production Supabase database via the SQL Editor.
2. Execute the migrations located in `supabase/migrations/` sequentially:
   - `20261002000000_init_schema.sql` (Creates core tables, indexes, functions, foreign keys, and default seed data)
   - `20261002000001_security_hardening.sql` (Isolates auth helpers in `app_auth` schema to prevent PostgREST RPC exposure; updates RLS)
   - `20261002000002_storage_setup.sql` (Sets up the private `incident-attachments` storage bucket and base object RLS)
   - `20261002000003_audit_and_storage_hardening.sql` (Enforces bucket privacy, path UUID validation, and append-only audit log immutability)
   - `20261002000004_fix_function_permissions.sql` (Applies function execute permissions for anon and authenticated roles)
   - `20261002000005_grant_generate_report_number.sql` (Grants execution of report number sequence generation to authenticated users)
   - `20261002000006_prevent_incident_reporter_reassignment.sql` (Prohibits modification or tampering of `reporter_id` on existing incidents)
   - `20261002000007_auto_close_resolved_incidents.sql` (Auto-close database trigger: setting status to `resolved` automatically marks `closed` with timestamps)
   - `20261002000008_add_profile_department_id.sql` (Adds `department_id` foreign key and index to `profiles` for staff-to-department binding)
   - `20261020000000_add_assignment_fields.sql` (Adds `field_responder` [Responder 1–5] and `instruction` check constraints and indexes)
   - `20261021000000_add_dispatch_vehicle.sql` (Adds `dispatch_vehicle` [Vehicle 1–5] check constraint and index to `incident_assignments`)
3. Confirm that the `incident-attachments` private storage bucket is created and marked private.

---

## 4. Clerk Production Domain & Redirects

1. Navigate to **Clerk Dashboard > Domains & Paths**.
2. Add your custom production domain (e.g. `report.butuancity.gov.ph` or `butuan-report.vercel.app`).
3. Under **User & Authentication > Paths**, ensure:
   - Sign-in path: `/sign-in`
   - Sign-up path: `/sign-up`
   - After sign-in path: `/dashboard`
   - After sign-up path: `/dashboard`

---

## 5. Deployment on Vercel

1. Log into **Vercel** and click **"Add New Project"**.
2. Import the `butuan-report` Git repository.
3. Framework Preset: **Next.js** (auto-detected).
4. Build Command: `npm run build`
5. Output Directory: `.next`
6. Add the environment variables described above.
7. Click **Deploy**.

---

## 6. Initial Administrator Bootstrap

New user accounts created through standard registration default strictly to the `resident` role for defense-in-depth security. To designate your initial administrator, choose one of the three supported secure methods:

### Method A: Environment Variable (Recommended for Hosted Deployments)
Add the target administrator's Clerk User ID to your Vercel or hosting environment settings:
```
INITIAL_ADMIN_CLERK_USER_ID=user_your_clerk_id_here
```
When this designated account signs in, the server securely initializes or elevates their role to `admin` if zero administrators currently exist in the database. If active administrators already exist, authorized demotions are strictly respected and preserved without re-elevation.

### Method B: Controlled CLI Script
From your local administrative terminal (with `.env.local` configured with `SUPABASE_SECRET_KEY`):
```bash
npm run bootstrap:admin user_your_clerk_id_here
```
This script validates the user ID, elevates `public.profiles.role` to `'admin'`, and writes an audit log entry.

### Method C: Direct Supabase SQL Editor
In the Supabase Dashboard SQL Editor, execute:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE clerk_user_id = 'user_your_clerk_user_id_here';
```

After role elevation, the administrator can navigate to `/admin` or `/admin/sign-in` to access the full administrative command suite.

---

## 7. Post-Deployment Verification

Execute the following smoke tests on your production domain:
1. **Resident Flow**:
   - Register a resident account $\rightarrow$ submit a test incident report with an attachment.
   - Verify report appears in `/dashboard/my-reports`.
2. **Admin Flow**:
   - Sign in to `/admin` with the bootstrapped admin account.
   - Triage the submitted incident report, assign a department, and post a public update.
   - Verify the resident receives a notification on `/dashboard/notifications`.
3. **Security Check**:
   - Log in as a resident and verify attempting to access `/admin` redirects back to `/dashboard`.
