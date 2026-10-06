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
| `SUPABASE_SECRET_KEY` | Server Only (Secret) | Supabase service-role secret (used only for background notification dispatching) |

> ⚠️ **CRITICAL**: Never expose `CLERK_SECRET_KEY` or `SUPABASE_SECRET_KEY` to client-side code or browser bundles.

---

## 3. Database & Storage Initialization

1. Connect to your production Supabase database via the SQL Editor.
2. Execute the migrations located in `supabase/migrations/` sequentially:
   - `20261002000000_init_schema.sql` (Creates tables, indexes, functions, foreign keys, and default data)
   - `20261002000001_security_hardening.sql` (Applies Clerk RLS policies)
   - `20261002000002_storage_setup.sql` (Sets up the storage bucket)
   - `20261002000003_audit_and_storage_hardening.sql` (Applies bucket constraints, MIME validation, and immutable audit logs)
3. Confirm that the `incident-attachments` private storage bucket is created.

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

When your first administrator registers via `/sign-in`, their account will default to the `resident` role. To elevate this account to `admin`:

Run the following query in the Supabase SQL Editor:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE clerk_user_id = 'user_your_clerk_user_id_here';
```

After role assignment, the administrator can sign in via `/admin/sign-in` and access the full administrative suite (`/admin`, `/admin/reports`, `/admin/users`, `/admin/departments`, `/admin/categories`, `/admin/audit-logs`).

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
