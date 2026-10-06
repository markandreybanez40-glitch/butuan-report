# Butuan Report — Civic Incident Reporting & Municipal Dispatch System

**Butuan Report** is a modern, high-reliability civic reporting and municipal dispatch web platform built for Butuan City, Agusan del Norte, Philippines. It connects citizens across all 86 barangays with municipal departments (CDRRMO, CEO, City ENRO, CHO, CGSO) for swift reporting, verified triage, field response tracking, and resolution.

---

## 🏛️ System Architecture & Technology Stack

- **Framework**: Next.js 16 (App Router with Turbopack) & React 19
- **Authentication**: Clerk Authentication (`@clerk/nextjs`)
- **Database & Storage**: Supabase (PostgreSQL with Row Level Security & Private S3 Storage)
- **Mapping & GIS**: Leaflet & OpenStreetMap tiles
- **Styling & UI**: Tailwind CSS v4, shadcn/ui components, Lucide Icons, and dark/light mode theme support

---

## 👥 User Roles & Permissions Matrix

| Role | Portal Route | Access Scope & Permitted Actions |
|---|---|---|
| **Resident** (`resident`) | `/dashboard` | File incident reports with photos/GPS, track personal tickets, receive real-time notifications, view personal incident map. |
| **Responder** (`responder`) | `/staff` | View assigned field tickets, post public updates and internal notes, mark incidents as in progress or resolved. |
| **Dispatcher** (`dispatcher`) | `/staff` | City-wide incident triage, assign tickets to municipal departments or specific responders, update status levels. |
| **Admin** (`admin`) | `/admin` & `/staff` | Manage user role authorizations (`/admin/users`), configure departments (`/admin/departments`), manage hazard categories (`/admin/categories`), inspect immutable security audit logs (`/admin/audit-logs`). |

---

## 📖 Complete User & Operator Guide

### 1. Resident Workflow
1. **Sign Up / Sign In**: Register using email/password authentication on `/sign-in` or `/sign-up`. Account profile is automatically synchronized with the database.
2. **Submit Incident (`/dashboard/new`)**:
   - Provide Title, Detailed Description, Category, Estimated Severity, and Barangay location.
   - Use the **Interactive Map Picker** to drop a pin or click **"Use My Location"** for GPS auto-detection.
   - Upload up to 5 photo or document evidence files (JPG, PNG, WebP, HEIC, GIF, PDF up to 10MB each).
3. **Track Incident Reports (`/dashboard/reports`)**:
   - View all filed reports with status badges (`Submitted`, `Under Review`, `Assigned`, `In Progress`, `Resolved`, `Closed`).
   - Filter and search by keyword or status.
4. **Inspect Progress Timeline (`/dashboard/reports/[id]`)**:
   - View milestone dates, assigned department status, and public response notes posted by municipal crews.
5. **Interactive Resident Map (`/dashboard/map`)**:
   - View spatial clusters of personal reports across Butuan City.
6. **Notifications (`/dashboard/notifications`)**:
   - Receive real-time system alerts on ticket assignments and status transitions.

---

### 2. Municipal Staff & Dispatcher Workflow
1. **Queue Inspection (`/staff` & `/staff/incidents`)**:
   - Dispatchers review incoming unassigned reports across all 86 barangays.
   - Responders view tickets assigned specifically to their team.
2. **Incident Assignment**:
   - Assign tickets to target departments (e.g. City Engineering Office, CDRRMO, City ENRO) or designated field responders.
   - Status automatically advances to `Assigned`.
3. **Public Updates & Internal Notes**:
   - Post **Public Updates** visible to the reporting citizen on their timeline.
   - Post **Internal Notes** (`visibility = 'internal'`) restricted strictly to municipal staff for departmental coordination.
4. **Resolution & Archival**:
   - Mark incidents as `In Progress`, `Resolved` (records resolution timestamp), or `Closed`.
5. **Municipal Operations Map (`/staff/map`)**:
   - Live GIS map with multi-filter controls (Status, Severity, Category, Barangay).

---

### 3. Administrator Workflow
1. **User Role Authorization (`/admin/users`)**:
   - Inspect registered accounts and promote/demote roles (`resident`, `responder`, `dispatcher`, `admin`).
   - Self-demotion protection prevents administrators from accidentally revoking their own access.
2. **Department Management (`/admin/departments`)**:
   - Add new municipal divisions, edit descriptions, and toggle active status.
3. **Category Management (`/admin/categories`)**:
   - Configure public hazard reporting categories and classification rules.
4. **Security Audit Trail (`/admin/audit-logs`)**:
   - Inspect immutable, append-only security logs capturing user role modifications, department changes, and master data updates.

---

## ⚙️ Environment Variables

Create a `.env.local` file in the project root:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase Database & API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxx
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **Security Note:** `CLERK_SECRET_KEY` and `SUPABASE_SECRET_KEY` are server-only secrets. Never expose them to client bundles or commit `.env.local` to source control.

---

## 🚀 Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Database Migrations
Execute the SQL migration scripts in order on your Supabase PostgreSQL instance:
1. `supabase/migrations/20261002000000_init_schema.sql` (Tables, indexes, triggers, and seed data)
2. `supabase/migrations/20261002000001_security_hardening.sql` (RLS policies and `app_auth` schema isolation)
3. `supabase/migrations/20261002000002_storage_setup.sql` (Storage bucket initialization)
4. `supabase/migrations/20261002000003_audit_and_storage_hardening.sql` (Private storage checks and audit log immutability)

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build & Verification
```bash
npm run lint   # Run ESLint validation
npm run build  # Test production build bundle
```

---

## 🔒 Security & Data Protection Controls

1. **Row Level Security (RLS)**: Enforced across all database tables. Citizens can only view their own reports and public timeline updates.
2. **Private Storage Buckets**: Photo and document attachments are stored in a private bucket (`incident-attachments`) and served via short-lived signed URLs.
3. **Internal Notes Isolation**: Municipal coordination notes (`visibility = 'internal'`) are filtered out at the RLS database level.
4. **Append-Only Audit Logs**: System activity logs are write-restricted to administrators and cannot be altered or deleted.
5. **Production Headers**: Strict HTTP security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`) applied in `next.config.ts`.

---

## 📦 Deployment Instructions (Vercel / Production)

1. **Push to GitHub**:
   Ensure the repository is committed and pushed to your remote Git repository.
2. **Import Project to Vercel / Netlify**:
   - Framework preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next`
3. **Configure Environment Variables**:
   Add the 5 environment variables listed above under project settings.
4. **Configure Clerk Production Domain**:
   In Clerk Dashboard -> *Domains & Paths*, add your live production domain to allowed redirect origins.
5. **Initial Admin Setup**:
   To bootstrap the first administrator account:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE clerk_user_id = 'YOUR_CLERK_USER_ID';
   ```

---

## 🛠️ Basic Troubleshooting

- **Access Denied on `/admin` or `/staff`**: Newly registered accounts default to the `resident` role. An administrator must update the user's role via `/admin/users` or via SQL in Supabase.
- **Attachment Upload Failures**: Verify that the Supabase `incident-attachments` bucket exists and has the 10MB limit and MIME type constraints configured via `20261002000003_audit_and_storage_hardening.sql`.
- **Clerk Authentication Redirect Loops**: Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` match your Clerk instance and that redirect URLs match your environment.

---

## 📄 License & Compliance

© 2026 City Government of Butuan. Developed in compliance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).
