# Security Policy & Architecture — Butuan Report

## 1. Overview
**Butuan Report** implements defense-in-depth security to protect resident identities, confidential municipal communications, and infrastructure telemetry.

---

## 2. Authentication & Authorization

### Clerk Session Verification
- All protected layouts (`/dashboard`, `/staff`, `/admin`) verify active Clerk user sessions server-side.
- Authorization roles (`resident`, `responder`, `dispatcher`, `admin`) are stored in the database (`public.profiles`) and verified via server-side queries.
- Client-supplied role parameters are never trusted.

### Route Separation & Gatekeeping
- `/dashboard/*`: Restricted to authenticated residents and municipal users.
- `/staff/*`: Restricted to verified `responder`, `dispatcher`, and `admin` roles.
- `/admin/*`: Strictly locked to verified `admin` users. Non-admin requests are redirected server-side to `/dashboard`.

---

## 3. Database Row Level Security (RLS)

Row Level Security is enabled on every public database table:
- **`public.profiles`**: Users can only modify their own profile information. Role changes are restricted to administrators.
- **`public.incidents`**:
  - Residents can insert and select only incidents where `reporter_id = current_profile_id()`.
  - Operational staff (`responder`, `dispatcher`, `admin`) can view and manage incidents.
  - Public map queries access only sanitized public fields (excluding reporter identity and contact details).
- **`public.incident_updates`**:
  - Updates marked as `visibility = 'public'` are visible to the reporting resident.
  - Updates marked as `visibility = 'internal'` are strictly hidden from resident access.
- **`public.notifications`**:
  - Scoped to `user_id = current_profile_id()`. Users can only mark their own notifications as read.
- **`public.audit_logs`**:
  - Append-only ledger. Read access restricted exclusively to `admin` accounts. Deletion and modification are disabled.

---

## 4. Storage & Attachment Security

- **Private Buckets**: Files uploaded via `/dashboard/submit-report` are stored in the private `incident-attachments` bucket.
- **Signed URLs**: Attachments are accessed via short-lived, time-limited signed URLs (1-hour expiration) generated server-side.
- **File Validation**:
  - File count limit: Maximum 5 files per incident report.
  - File size limit: Maximum 10MB per file.
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
  - Executable files (`.exe`, `.sh`, `.bat`, `.js`, `.html`) are strictly rejected.

---

## 5. Defense Against Common Vulnerabilities

- **Insecure Direct Object References (IDOR)**:
  - Database queries automatically filter on caller identity via RLS JWT claims. Attempting to access an incident ID belonging to another resident returns a 404/not-found error.
- **Privilege Escalation**:
  - Admin server actions include self-demotion guards preventing administrators from revoking their own roles or locking themselves out.
- **Secret Key Isolation**:
  - `SUPABASE_SECRET_KEY` and `CLERK_SECRET_KEY` are isolated to server actions and server utility files (`lib/supabase/server.ts`). Zero private secrets exist in client bundles.
- **HTTP Security Headers**:
  - Applied globally via `next.config.ts`:
    - `X-Frame-Options: DENY`
    - `X-Content-Type-Options: nosniff`
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`

---

## 6. Privacy & Legal Compliance

The platform is designed in compliance with the **Philippine Data Privacy Act of 2012 (Republic Act No. 10173)**. Detailed policies are published at:
- `/privacy` — Privacy Policy
- `/terms` — Terms of Service
- `/data-collection` — Data Collection & Retention Notice
- `/contact` — Contact & Emergency Notice
