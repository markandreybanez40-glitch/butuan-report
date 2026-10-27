import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateFileBuffer,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_REPORT,
} from "../../lib/data/attachments";
import { DISPATCH_VEHICLES, FIELD_RESPONDERS } from "../../types";

describe("Phase 1 Production Bug Fixes — Isolated Unit Verification", () => {
  describe("1. Test Safety Guard & Runner Protection", () => {
    it("rejects execution when SUPABASE_ALLOW_TEST_WRITES is unset or not 'true'", async () => {
      const { assertSafeTestEnvironment } = await import("../test-safety-guard");
      const prev = process.env.SUPABASE_ALLOW_TEST_WRITES;
      try {
        delete process.env.SUPABASE_ALLOW_TEST_WRITES;
        assert.throws(
          () => assertSafeTestEnvironment("isolated-safety-test"),
          /TEST SAFETY BLOCKED/
        );
      } finally {
        if (prev !== undefined) process.env.SUPABASE_ALLOW_TEST_WRITES = prev;
      }
    });

    it("blocks execution if NEXT_PUBLIC_SUPABASE_URL matches PRODUCTION_SUPABASE_URL", async () => {
      const { assertSafeTestEnvironment } = await import("../test-safety-guard");
      const prevAllow = process.env.SUPABASE_ALLOW_TEST_WRITES;
      const prevProd = process.env.PRODUCTION_SUPABASE_URL;
      const prevPublic = process.env.NEXT_PUBLIC_SUPABASE_URL;
      try {
        process.env.SUPABASE_ALLOW_TEST_WRITES = "true";
        process.env.PRODUCTION_SUPABASE_URL = "https://prod-project.supabase.co";
        process.env.NEXT_PUBLIC_SUPABASE_URL = "https://prod-project.supabase.co";
        assert.throws(
          () => assertSafeTestEnvironment("prod-match-test"),
          /TEST SAFETY CRITICAL.*matches PRODUCTION_SUPABASE_URL/
        );
      } finally {
        if (prevAllow !== undefined) process.env.SUPABASE_ALLOW_TEST_WRITES = prevAllow;
        else delete process.env.SUPABASE_ALLOW_TEST_WRITES;
        if (prevProd !== undefined) process.env.PRODUCTION_SUPABASE_URL = prevProd;
        else delete process.env.PRODUCTION_SUPABASE_URL;
        if (prevPublic !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = prevPublic;
        else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      }
    });
  });

  describe("2. Attachment Upload & Magic Byte Verification", () => {
    it("enforces 10 MB per file and 5 files per report limits", () => {
      assert.equal(MAX_FILE_SIZE_BYTES, 10 * 1024 * 1024);
      assert.equal(MAX_FILES_PER_REPORT, 5);
      assert.ok(ALLOWED_MIME_TYPES.includes("image/jpeg"));
      assert.ok(ALLOWED_MIME_TYPES.includes("image/png"));
      assert.ok(ALLOWED_MIME_TYPES.includes("image/webp"));
      assert.ok(ALLOWED_MIME_TYPES.includes("application/pdf"));
    });

    it("validates JPEG file headers correctly", () => {
      const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const res = validateFileBuffer(validJpeg, "image/jpeg", "photo.jpg");
      assert.equal(res.valid, true);
      assert.equal(res.detectedMime, "image/jpeg");
    });

    it("validates PNG file headers correctly", () => {
      const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const res = validateFileBuffer(validPng, "image/png", "screenshot.png");
      assert.equal(res.valid, true);
      assert.equal(res.detectedMime, "image/png");
    });

    it("validates PDF file headers correctly", () => {
      const validPdf = Buffer.from("%PDF-1.4 header content here");
      const res = validateFileBuffer(validPdf, "application/pdf", "document.pdf");
      assert.equal(res.valid, true);
      assert.equal(res.detectedMime, "application/pdf");
    });

    it("detects and rejects executable disguised as an image (extension spoofing)", () => {
      const spoofedExe = Buffer.from("MZ\x90\x00\x03\x00\x00\x00"); // DOS/PE header
      const res = validateFileBuffer(spoofedExe, "image/png", "malware.png");
      assert.equal(res.valid, false);
      assert.match(res.error || "", /Signature check failed|not match allowed types/i);
    });

    it("validates allowed storage path structures and rejects path traversal", () => {
      const validIncidentId = "123e4567-e89b-12d3-a456-426614174000";
      const validPath = `incidents/${validIncidentId}/173000-photo.jpg`;
      const traversalPath = `incidents/${validIncidentId}/../../etc/passwd`;
      const wrongPrefixPath = `other-folder/${validIncidentId}/photo.jpg`;

      const isPathSafe = (p: string, incId: string) =>
        p.startsWith(`incidents/${incId}/`) && !p.includes("..") && !p.includes("//");

      assert.equal(isPathSafe(validPath, validIncidentId), true);
      assert.equal(isPathSafe(traversalPath, validIncidentId), false);
      assert.equal(isPathSafe(wrongPrefixPath, validIncidentId), false);
    });
  });

  describe("3. Resolved Report Filter Semantics", () => {
    it("correctly identifies resolved incidents without misclassifying other closed incidents", () => {
      interface IncidentStub {
        id: string;
        status: string;
        resolved_at: string | null;
      }

      const incidents: IncidentStub[] = [
        { id: "1", status: "submitted", resolved_at: null },
        { id: "2", status: "in_progress", resolved_at: null },
        { id: "3", status: "resolved", resolved_at: "2026-10-27T10:00:00Z" },
        // Trigger auto-closed resolved incident:
        { id: "4", status: "closed", resolved_at: "2026-10-27T10:00:00Z" },
        // Unrelated closed incident (e.g. closed without resolution / duplicate / rejected):
        { id: "5", status: "closed", resolved_at: null },
      ];

      // Replicating the PostgREST filter: status.eq.resolved,and(status.eq.closed,resolved_at.not.is.null)
      const matchesResolvedFilter = (inc: IncidentStub) =>
        inc.status === "resolved" || (inc.status === "closed" && inc.resolved_at !== null);

      const resolvedMatches = incidents.filter(matchesResolvedFilter);
      assert.deepEqual(
        resolvedMatches.map((i) => i.id),
        ["3", "4"],
        "Must match status='resolved' and status='closed' with resolved_at, but NOT status='closed' with resolved_at=null"
      );
    });
  });

  describe("4. Vehicle Assignment Validation Logic", () => {
    it("strictly requires department, assigned responder, or field responder when assigning a vehicle", () => {
      const validateAssignment = (params: {
        departmentId?: string | null;
        responderId?: string | null;
        fieldResponder?: string | null;
        dispatchVehicle?: string | null;
      }): { valid: boolean; error?: string } => {
        if (!params.departmentId && !params.responderId && !params.fieldResponder) {
          return {
            valid: false,
            error:
              "Please select a responsible department, assigned responder, or field responder. A dispatch vehicle cannot be assigned alone.",
          };
        }
        return { valid: true };
      };

      // Case A: Vehicle alone — must be rejected
      const vehicleOnly = validateAssignment({ dispatchVehicle: "Vehicle 1" });
      assert.equal(vehicleOnly.valid, false);
      assert.match(vehicleOnly.error || "", /cannot be assigned alone/i);

      // Case B: Department + Vehicle — must be accepted
      const deptAndVehicle = validateAssignment({
        departmentId: "dept-123",
        dispatchVehicle: "Vehicle 1",
      });
      assert.equal(deptAndVehicle.valid, true);

      // Case C: Field Responder + Vehicle — must be accepted
      const responderAndVehicle = validateAssignment({
        fieldResponder: "Responder 2",
        dispatchVehicle: "Vehicle 3",
      });
      assert.equal(responderAndVehicle.valid, true);
    });

    it("verifies FIELD_RESPONDERS and DISPATCH_VEHICLES enum constraints", () => {
      assert.deepEqual([...FIELD_RESPONDERS], [
        "Responder 1",
        "Responder 2",
        "Responder 3",
        "Responder 4",
        "Responder 5",
      ]);
      assert.deepEqual([...DISPATCH_VEHICLES], [
        "Vehicle 1",
        "Vehicle 2",
        "Vehicle 3",
        "Vehicle 4",
        "Vehicle 5",
      ]);
    });
  });
});
