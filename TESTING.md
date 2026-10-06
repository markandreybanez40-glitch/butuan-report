# Testing & Quality Assurance Guide — Butuan Report

This document outlines the core smoke testing scenarios and validation procedures for **Butuan Report**.

---

## 1. Automated Verification Commands

Run the static analysis and production build checks:

```bash
# 1. Run ESLint code quality check
npm run lint

# 2. Run TypeScript compilation & Next.js production build
npm run build
```

---

## 2. Resident End-to-End Test Scenario

### Test Flow: Submit & Track Incident
1. **Authentication**:
   - Navigate to `/sign-in` or `/sign-up`.
   - Complete sign-in $\rightarrow$ Confirm automatic redirection to `/dashboard`.
2. **Submit Incident**:
   - Click **"Submit a Report"** or navigate to `/dashboard/submit-report`.
   - Fill in:
     - **Category**: Select an active category (e.g., *Road Hazards* or *Flooding*).
     - **Title**: *Damaged drainage canal on JC Aquino Ave*.
     - **Description**: *Large crack causing overflow during heavy rain.*
     - **Severity**: *High*.
     - **Barangay**: *Dagohoy*.
     - **Attachments**: Upload a sample photo (`.jpg` or `.png`).
   - Click **"Submit Incident Report"**.
   - Confirm success message with generated reference number (e.g. `BR-20261007-00001`).
3. **Verify My Reports**:
   - Navigate to `/dashboard/my-reports`.
   - Confirm newly filed report appears with status badge `Submitted`.
4. **Inspect Details**:
   - Click on the report to view `/dashboard/reports/[id]`.
   - Verify timeline displays submission milestone.
5. **Interactive Incident Map**:
   - Navigate to `/dashboard/incident-map`.
   - Confirm report location pin renders on the map.
6. **Notifications**:
   - Navigate to `/dashboard/notifications`.
   - Confirm welcome/status notifications are displayed.

---

## 3. Administrator & Operations Test Scenario

### Test Flow: Triage, Department Assignment & Updates
1. **Admin Authentication**:
   - Navigate to `/admin/sign-in`.
   - Sign in with an account having the `admin` role.
   - Confirm redirection to `/admin`.
2. **Review Incident Backlog**:
   - Navigate to `/admin/reports`.
   - Locate the resident test report.
   - Click the report to open `/admin/reports/[id]`.
3. **Operational Triage Actions**:
   - **Update Status**: Transition status from `submitted` $\rightarrow$ `under_review` $\rightarrow$ `assigned`.
   - **Assign Department**: Select *City Engineering Office (CEO)* or *CDRRMO*.
   - **Post Public Update**: Enter message *“Inspection team dispatched to evaluate drainage.”* $\rightarrow$ Submit.
   - **Post Internal Note**: Enter message *“Requires heavy backhoe from central depot.”* with visibility *Internal* $\rightarrow$ Submit.
4. **Verify Resident Notification Dispatch**:
   - In a separate browser/incognito session logged in as the resident:
   - Navigate to `/dashboard/notifications`.
   - Confirm notification received: *“Report Status Updated: Your report has been updated to Assigned.”*
   - Confirm public update appears on resident timeline; internal note is **NOT** visible.
5. **Master Data & User Management**:
   - Navigate to `/admin/users` $\rightarrow$ Search users, test role filtering.
   - Navigate to `/admin/departments` $\rightarrow$ Test toggling department active status.
   - Navigate to `/admin/categories` $\rightarrow$ Test viewing and managing hazard categories.
   - Navigate to `/admin/audit-logs` $\rightarrow$ Verify all triage actions, assignments, and updates are logged in the audit ledger.

---

## 4. Security & Access Boundary Tests

| Test Case | Expected Result |
|---|---|
| Non-admin visits `/admin` | Redirected to `/dashboard` |
| Non-staff visits `/staff` | Redirected to `/dashboard` |
| Resident requests another user's report URL | Returns 404 / Access Denied |
| Resident inspects network responses on report details | Internal notes (`visibility: 'internal'`) are completely absent |
| Unauthenticated user accesses `/dashboard` | Redirected to `/sign-in` |
| Uploading non-allowed file extension (e.g. `.exe`) | Server action rejects upload with validation error |
