import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { setTestAuthContext } from "@/lib/data/profiles";
import {
  createResidentIncident,
} from "@/lib/data/incidents";
import {
  uploadIncidentAttachment,
  validateFileBuffer,
  MAX_FILES_PER_REPORT,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
} from "@/lib/data/attachments";
import type { Profile, IncidentCategory } from "@/types";

const TEST_SUBMITTER_CLERK_ID = "test_resident_evidence_order_clerk_id";

describe("Butuan Report — Submit Report Page: Photo & Document Evidence Ordering & Functionality", () => {
  const supabase = createAdminSupabaseClient();
  let testProfile: Profile;
  let activeCategory: IncidentCategory;
  const createdIncidentIds: string[] = [];

  before(async () => {
    setTestAuthContext(null);

    // 1. Cleanup any previous test profile
    await supabase.from("profiles").delete().eq("clerk_user_id", TEST_SUBMITTER_CLERK_ID);

    // 2. Setup test resident profile
    const { data: profile, error } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: TEST_SUBMITTER_CLERK_ID,
        full_name: "Test Resident Evidence Tester",
        role: "resident",
        barangay: "Doongan",
      })
      .select()
      .single();

    assert.ok(profile && !error, `Failed to setup test resident: ${error?.message}`);
    testProfile = profile;

    // 3. Get active category
    const { data: categories } = await supabase
      .from("incident_categories")
      .select("*")
      .eq("is_active", true)
      .limit(1);

    assert.ok(categories && categories.length > 0, "No active category found");
    activeCategory = categories[0];
  });

  after(async () => {
    setTestAuthContext(null);

    // Clean up created test incidents
    if (createdIncidentIds.length > 0) {
      await supabase.from("notifications").delete().in("related_incident_id", createdIncidentIds);
      await supabase.from("incident_updates").delete().in("incident_id", createdIncidentIds);
      await supabase.from("incident_assignments").delete().in("incident_id", createdIncidentIds);
      await supabase.from("incident_attachments").delete().in("incident_id", createdIncidentIds);
      await supabase.from("incidents").delete().in("id", createdIncidentIds);
    }

    if (testProfile?.id) {
      await supabase.from("profiles").delete().eq("id", testProfile.id);
    }
  });

  test("1. Layout Verification: Photo & Document Evidence is positioned at the bottom after all other fields", () => {
    const formFilePath = path.join(
      process.cwd(),
      "components",
      "dashboard",
      "new-report-form.tsx"
    );
    const formContent = fs.readFileSync(formFilePath, "utf-8");

    // Form title confirms "Report Details"
    assert.match(
      formContent,
      /<CardTitle[^>]*>Report Details<\/CardTitle>/,
      "Card title should be Report Details"
    );

    // Form element has id and aria-label
    assert.match(
      formContent,
      /id="report-details-form"/,
      "Form must have id='report-details-form'"
    );

    // Locate section indices in the file
    const classificationIdx = formContent.indexOf("Incident Classification");
    const reportDetailsIdx = formContent.indexOf("<span>Report Details</span>");
    const locationIdx = formContent.indexOf("Incident Location");
    const evidenceIdx = formContent.indexOf("Photo & Document Evidence");
    const submissionBarIdx = formContent.indexOf("Submission Bar");

    assert.ok(classificationIdx > 0, "Incident Classification section must exist");
    assert.ok(reportDetailsIdx > 0, "Report Details section must exist");
    assert.ok(locationIdx > 0, "Incident Location section must exist");
    assert.ok(evidenceIdx > 0, "Photo & Document Evidence section must exist");
    assert.ok(submissionBarIdx > 0, "Submission Bar must exist");

    // Verify ordering: Classification < Report Details < Photo & Document Evidence < Incident Location < Submission Bar
    assert.ok(
      classificationIdx < reportDetailsIdx,
      "Incident Classification must come before Report Details"
    );
    assert.ok(
      reportDetailsIdx < evidenceIdx,
      "Report Details must come directly before Photo & Document Evidence"
    );
    assert.ok(
      evidenceIdx < locationIdx,
      "Photo & Document Evidence must come directly before Incident Location"
    );
    assert.ok(
      locationIdx < submissionBarIdx,
      "Incident Location must come before the Submission Bar"
    );

    // Verify input fields order
    const categoryFieldIdx = formContent.indexOf('name="category_id"');
    const severityFieldIdx = formContent.indexOf('name="severity"');
    const titleFieldIdx = formContent.indexOf('name="title"');
    const descriptionFieldIdx = formContent.indexOf('name="description"');
    const barangayFieldIdx = formContent.indexOf('name="barangay"');
    const streetFieldIdx = formContent.indexOf('name="street_area"');
    const landmarkFieldIdx = formContent.indexOf('name="landmark"');
    const mapPickerIdx = formContent.indexOf("<LocationPickerMap");
    const latFieldIdx = formContent.indexOf('name="latitude"');
    const lngFieldIdx = formContent.indexOf('name="longitude"');

    // Title & Description precede Evidence
    assert.ok(categoryFieldIdx < severityFieldIdx, "Category must come before Severity");
    assert.ok(severityFieldIdx < titleFieldIdx, "Severity must come before Title");
    assert.ok(titleFieldIdx < descriptionFieldIdx, "Title must come before Description");
    assert.ok(
      descriptionFieldIdx < evidenceIdx,
      "Description (in Report Details) must come before Photo & Document Evidence"
    );
    // Evidence precedes Location fields
    assert.ok(
      evidenceIdx < barangayFieldIdx,
      "Photo & Document Evidence must come before Barangay (in Incident Location)"
    );
    assert.ok(barangayFieldIdx < streetFieldIdx, "Barangay must come before Street");
    assert.ok(streetFieldIdx < landmarkFieldIdx, "Street must come before Landmark");
    assert.ok(landmarkFieldIdx < mapPickerIdx, "Landmark must come before Map Picker");
    assert.ok(mapPickerIdx < latFieldIdx, "Map Picker must come before Latitude");
    assert.ok(latFieldIdx < lngFieldIdx, "Latitude must come before Longitude");
    assert.ok(
      lngFieldIdx < submissionBarIdx,
      "Longitude must come before Submission Bar"
    );

    // Verify visible latitude/longitude labels are removed
    assert.ok(
      !formContent.includes('<label htmlFor="latitude"'),
      "Visible Latitude label should be removed"
    );
    assert.ok(
      !formContent.includes('<label htmlFor="longitude"'),
      "Visible Longitude label should be removed"
    );
  });

  test("2. File validation & limits: Enforces 10MB limit, allowed MIME types, and magic bytes", () => {
    assert.equal(MAX_FILES_PER_REPORT, 5, "Maximum files per report must be 5");
    assert.equal(MAX_FILE_SIZE_BYTES, 10 * 1024 * 1024, "Maximum file size must be 10MB");

    // Allowed types
    const expectedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/gif",
      "application/pdf",
    ];
    for (const t of expectedTypes) {
      assert.ok(ALLOWED_MIME_TYPES.includes(t), `MIME type ${t} should be allowed`);
    }

    // Invalid type rejection
    assert.ok(!ALLOWED_MIME_TYPES.includes("application/x-executable"));
    assert.ok(!ALLOWED_MIME_TYPES.includes("text/javascript"));
    assert.ok(!ALLOWED_MIME_TYPES.includes("application/zip"));

    // Magic byte inspection for PNG
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const validPng = validateFileBuffer(pngBuffer, "image/png", "photo.png");
    assert.equal(validPng.valid, true, "Valid PNG magic bytes must be accepted");

    // Spoofed extension with executable bytes
    const fakeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00]); // DOS/PE header
    const spoofed = validateFileBuffer(fakeBuffer, "image/png", "malware.png");
    assert.equal(spoofed.valid, false, "Spoofed file headers must be rejected");
  });

  test("3. Report submission WITHOUT attachments succeeds smoothly", async () => {
    setTestAuthContext(TEST_SUBMITTER_CLERK_ID);

    const incident = await createResidentIncident({
      title: "[TEST] Evidence Order Test Without Attachments",
      description: "Testing report details form submission without any attached files.",
      category_id: activeCategory.id,
      severity: "medium",
      barangay: "Doongan",
      street_area: "Montilla Boulevard",
      landmark: "Near City Hall",
      latitude: 8.9515,
      longitude: 125.5321,
    });

    assert.ok(incident, "Incident should be created without attachments");
    assert.ok(incident.id, "Created incident must have an id");
    assert.equal(incident.status, "submitted");
    assert.equal(incident.reporter_id, testProfile.id);
    createdIncidentIds.push(incident.id);

    // Verify attachments count is 0
    const { data: attachments } = await supabase
      .from("incident_attachments")
      .select("id")
      .eq("incident_id", incident.id);

    assert.equal(attachments?.length || 0, 0, "No attachments should be present");
  });

  test("4. Report submission WITH attachments succeeds and links files to incident", async () => {
    setTestAuthContext(TEST_SUBMITTER_CLERK_ID);

    const incident = await createResidentIncident({
      title: "[TEST] Evidence Order Test With Evidence Attachments",
      description: "Testing report details form submission with photo and document evidence.",
      category_id: activeCategory.id,
      severity: "high",
      barangay: "Doongan",
      street_area: "J.C. Aquino Avenue",
      landmark: "Beside Robinsons Place",
      latitude: 8.9482,
      longitude: 125.5415,
    });

    assert.ok(incident, "Incident should be created");
    createdIncidentIds.push(incident.id);

    // Upload PNG photo evidence
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
    ]);
    const photoFile = new File([pngBuffer], "pothole_evidence.png", { type: "image/png" });
    const photoAttachment = await uploadIncidentAttachment(incident.id, photoFile);

    assert.ok(photoAttachment, "Photo evidence attachment must upload successfully");
    assert.equal(photoAttachment.incident_id, incident.id);
    assert.equal(photoAttachment.original_filename, "pothole_evidence.png");

    // Upload PDF document evidence
    const pdfBuffer = Buffer.from("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");
    const pdfFile = new File([pdfBuffer], "incident_assessment.pdf", { type: "application/pdf" });
    const pdfAttachment = await uploadIncidentAttachment(incident.id, pdfFile);

    assert.ok(pdfAttachment, "PDF document evidence attachment must upload successfully");
    assert.equal(pdfAttachment.incident_id, incident.id);
    assert.equal(pdfAttachment.original_filename, "incident_assessment.pdf");

    // Verify both attachments exist in database
    const { data: attachments } = await supabase
      .from("incident_attachments")
      .select("id, original_filename, mime_type")
      .eq("incident_id", incident.id);

    assert.equal(attachments?.length, 2, "Incident must have exactly 2 attached evidence files");
    const filenames = attachments.map((a) => a.original_filename);
    assert.ok(filenames.includes("pothole_evidence.png"), "Photo must be in attachments");
    assert.ok(filenames.includes("incident_assessment.pdf"), "PDF document must be in attachments");
  });
});
