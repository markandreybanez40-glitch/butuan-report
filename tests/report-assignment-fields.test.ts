import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { assertSafeTestEnvironment } from './test-safety-guard';
import { FIELD_RESPONDERS, DISPATCH_INSTRUCTIONS, type FieldResponder, type DispatchInstruction } from '../types';
import { createAdminSupabaseClient } from '../lib/supabase/server';
import { setTestAuthContext } from '../lib/data/profiles';
import { adminAssignIncidentAction, updateAdminReportQuickAction } from '../app/admin/actions';
import { assignIncidentStaffAction } from '../app/staff/actions';
import { getStaffIncidentDetails } from '../lib/data/staff';
import { getAdminAssignmentsPaginatedQueue } from '../lib/data/admin';

describe('Butuan Report — Update Admin Report Assignment Fields Verification', () => {
  assertSafeTestEnvironment('Update Admin Report Assignment Fields Verification');
  const supabase = createAdminSupabaseClient();
  let adminClerkUserId: string | null = null;
  let testIncidentId: string;

  before(async () => {
    // Locate an existing admin profile or create a test one
    const { data: admin } = await supabase
      .from('profiles')
      .select('id, clerk_user_id, role')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    if (admin) {
      adminClerkUserId = admin.clerk_user_id;
    } else {
      const { data: newAdmin } = await supabase
        .from('profiles')
        .insert({
          clerk_user_id: 'test_admin_assignment_fields_clerk_id',
          full_name: 'Test Administrator',
          role: 'admin',
        })
        .select()
        .single();
      adminClerkUserId = newAdmin!.clerk_user_id;
    }

    setTestAuthContext(adminClerkUserId);

    // Find a test incident
    const { data: incident } = await supabase
      .from('incidents')
      .select('id, report_number')
      .limit(1)
      .single();

    assert.ok(incident, 'Incident must exist for test suite');
    testIncidentId = incident.id;
  });

  after(() => {
    setTestAuthContext(null);
  });

  it('1. FIELD_RESPONDERS contains exactly Responder 1 to Responder 5', () => {
    assert.deepEqual(
      [...FIELD_RESPONDERS],
      ['Responder 1', 'Responder 2', 'Responder 3', 'Responder 4', 'Responder 5'],
      'FIELD_RESPONDERS must match exact required options'
    );
    assert.equal(FIELD_RESPONDERS.length, 5);
  });

  it('2. DISPATCH_INSTRUCTIONS contains exactly the 8 predefined options', () => {
    const expected = [
      'Inspect Incident Location',
      'Assess Incident Severity',
      'Secure the Affected Area',
      'Provide Immediate Assistance',
      'Coordinate With Relevant Department',
      'Prepare Required Equipment',
      'Follow Up on Incident',
      'Verify Incident Resolution',
    ];
    assert.deepEqual([...DISPATCH_INSTRUCTIONS], expected, 'DISPATCH_INSTRUCTIONS must contain exactly 8 options');
    assert.equal(DISPATCH_INSTRUCTIONS.length, 8);
  });

  it('3. Rejects custom responder names (Validation on server)', async () => {
    // Test admin action validation
    const invalidAdminRes = await adminAssignIncidentAction({
      incidentId: testIncidentId,
      fieldResponder: 'John Doe' as unknown as FieldResponder,
    });
    assert.equal(invalidAdminRes.success, false);
    assert.match(invalidAdminRes.error || '', /Invalid field responder/i);

    // Test staff action validation
    const formData = new FormData();
    formData.append('incident_id', testIncidentId);
    formData.append('field_responder', 'Officer CustomName');
    const invalidStaffRes = await assignIncidentStaffAction(formData);
    assert.equal(invalidStaffRes.success, false);
    assert.match(invalidStaffRes.error || '', /Invalid field responder/i);
  });

  it('4. Rejects invalid internal dispatch instructions (Validation on server)', async () => {
    // Test admin action validation
    const invalidAdminRes = await adminAssignIncidentAction({
      incidentId: testIncidentId,
      fieldResponder: 'Responder 1',
      dispatchInstruction: 'Custom instruction not in list' as unknown as DispatchInstruction,
    });
    assert.equal(invalidAdminRes.success, false);
    assert.match(invalidAdminRes.error || '', /Invalid.*dispatch instruction/i);

    // Test staff action validation
    const formData = new FormData();
    formData.append('incident_id', testIncidentId);
    formData.append('field_responder', 'Responder 2');
    formData.append('instruction', 'Random text instruction');
    const invalidStaffRes = await assignIncidentStaffAction(formData);
    assert.equal(invalidStaffRes.success, false);
    assert.match(invalidStaffRes.error || '', /Invalid.*dispatch instruction/i);
  });

  it('5. Assignment with valid Responder and Instruction persists and is retained upon reload', async () => {
    // Fetch an active department
    const { data: dept, error: deptError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('is_active', true)
      .limit(1)
      .single();
    assert.ok(!deptError && dept, 'Should find an active department');

    const testResponder: FieldResponder = 'Responder 3';
    const testInstruction: DispatchInstruction = 'Inspect Incident Location';

    const assignResult = await adminAssignIncidentAction({
      incidentId: testIncidentId,
      departmentId: dept.id,
      fieldResponder: testResponder,
      dispatchInstruction: testInstruction,
      assignmentNote: 'Unit en route for priority assessment',
    });

    assert.equal(assignResult.success, true, `Assignment should succeed: ${assignResult.error}`);

    // Reopen / fetch incident details as admin
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', adminClerkUserId!)
      .single();
    assert.ok(adminProfile, 'Admin profile exists');

    const details = await getStaffIncidentDetails(testIncidentId, adminProfile);
    assert.ok(details, 'Should load incident details on reload');

    const activeAssignment = details.assignments?.find((a) => a.unassigned_at === null);
    assert.ok(activeAssignment, 'Active assignment must exist');
    assert.equal(activeAssignment.field_responder, testResponder, 'Field responder must match selected option');
    assert.equal(activeAssignment.instruction, testInstruction, 'Instruction must match selected option');

    // Verify in Admin Assignments Queue
    const queueResult = await getAdminAssignmentsPaginatedQueue({
      responderId: testResponder,
      page: 1,
      pageSize: 10,
    });
    const foundInQueue = queueResult.incidents.some((i) => i.id === testIncidentId);
    assert.ok(foundInQueue, 'Incident should be filterable by Responder 3 in admin assignments queue');
  });

  it('6. Status Change Notes save persistently with internal visibility and do not leak to residents', async () => {
    const statusNoteText = `Internal investigation note verification #${Date.now()}`;

    // Add status change note via quick action
    const updateRes = await updateAdminReportQuickAction({
      incidentId: testIncidentId,
      statusChangeNote: statusNoteText,
      isInternalNote: true,
    });
    assert.equal(updateRes.success, true, `Status note update should succeed: ${updateRes.error}`);

    // Fetch the update directly from supabase
    const { data: savedUpdates, error: updError } = await supabase
      .from('incident_updates')
      .select('*')
      .eq('incident_id', testIncidentId)
      .order('created_at', { ascending: false });

    assert.ok(!updError && savedUpdates && savedUpdates.length > 0, 'Update must be saved');

    const matchingUpdate = savedUpdates.find((u) => u.message.includes(statusNoteText));
    assert.ok(matchingUpdate, 'Status change note must be persistently stored');
    assert.equal(matchingUpdate.visibility, 'internal', 'Status change note MUST have internal visibility');

    // Verify that resident queries (which enforce visibility = public) NEVER receive this note
    const residentVisibleUpdates = savedUpdates.filter((u) => u.visibility === 'public');
    const leakedToResident = residentVisibleUpdates.some((u) => u.message.includes(statusNoteText));
    assert.equal(leakedToResident, false, 'Internal status change notes must NEVER be exposed to residents');
  });

  it('7. Reassigning incident preserves historical audit trail and past assignments', async () => {
    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();
    assert.ok(dept, 'Department exists');

    // Perform re-assignment with Responder 5
    const reassignRes = await adminAssignIncidentAction({
      incidentId: testIncidentId,
      departmentId: dept.id,
      fieldResponder: 'Responder 5',
      dispatchInstruction: 'Verify Incident Resolution',
      assignmentNote: 'Final verification phase',
    });
    assert.equal(reassignRes.success, true);

    // Verify history records via getIncidentAssignmentHistoryAction
    const { getIncidentAssignmentHistoryAction } = await import('../app/admin/actions');
    const historyRes = await getIncidentAssignmentHistoryAction(testIncidentId);
    assert.equal(historyRes.success, true);
    assert.ok(historyRes.assignments && historyRes.assignments.length >= 2, 'History must contain past and current assignments');
    const activeCount = historyRes.assignments.filter((a) => a.unassigned_at === null).length;
    assert.equal(activeCount, 1, 'Exactly one active assignment should remain');
  });

  it('8. End-to-End Workflow: Admin assigns responder -> selects dispatch instruction -> changes status with a note -> saves -> reopens report -> verifies values -> checks resident view', async () => {
    // 1. Ensure a resident reporter exists for test incident
    const { data: incidentBefore } = await supabase
      .from('incidents')
      .select('id, reporter_id')
      .eq('id', testIncidentId)
      .single();

    assert.ok(incidentBefore, 'Incident must exist');

    let reporterClerkId: string;
    if (incidentBefore.reporter_id) {
      const { data: repProfile } = await supabase
        .from('profiles')
        .select('clerk_user_id')
        .eq('id', incidentBefore.reporter_id)
        .single();
      reporterClerkId = repProfile!.clerk_user_id;
    } else {
      // Find or create a resident user
      const { data: resident } = await supabase
        .from('profiles')
        .select('id, clerk_user_id')
        .eq('role', 'resident')
        .limit(1)
        .maybeSingle();

      let residentId = resident?.id;
      reporterClerkId = resident?.clerk_user_id || 'test_resident_clerk_user_id';

      if (!resident) {
        const { data: newRes } = await supabase
          .from('profiles')
          .insert({
            clerk_user_id: reporterClerkId,
            full_name: 'Test Resident Juan',
            role: 'resident',
          })
          .select()
          .single();
        residentId = newRes!.id;
      }

      await supabase
        .from('incidents')
        .update({ reporter_id: residentId })
        .eq('id', testIncidentId);
    }

    // Set auth context as Admin
    setTestAuthContext(adminClerkUserId);

    // 2. Admin assigns responder and selects dispatch instruction
    const { data: dept } = await supabase
      .from('departments')
      .select('id, name')
      .eq('is_active', true)
      .limit(1)
      .single();
    assert.ok(dept, 'Active department found');

    const chosenResponder: FieldResponder = 'Responder 4';
    const chosenInstruction: DispatchInstruction = 'Prepare Required Equipment';
    const e2eAssignmentNote = 'Deploying specialized equipment team';

    const assignRes = await adminAssignIncidentAction({
      incidentId: testIncidentId,
      departmentId: dept.id,
      fieldResponder: chosenResponder,
      dispatchInstruction: chosenInstruction,
      assignmentNote: e2eAssignmentNote,
    });
    assert.equal(assignRes.success, true, 'Admin assignment must succeed');

    // 3. Admin changes status with a note
    const e2eInternalNote = `Confidential dispatcher internal note #${Date.now()}`;
    const statusUpdateRes = await updateAdminReportQuickAction({
      incidentId: testIncidentId,
      status: 'in_progress',
      statusChangeNote: e2eInternalNote,
      isInternalNote: true,
    });
    assert.equal(statusUpdateRes.success, true, 'Status update with note must succeed');

    // 4. Admin reopens report and verifies all values
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', adminClerkUserId!)
      .single();
    assert.ok(adminProfile, 'Admin profile exists');
    const reopenedReport = await getStaffIncidentDetails(testIncidentId, adminProfile);
    assert.ok(reopenedReport, 'Admin must be able to reopen report');
    assert.equal(reopenedReport.status, 'in_progress', 'Status should be updated to in_progress');

    const activeAssign = reopenedReport.assignments?.find((a) => a.unassigned_at === null);
    assert.ok(activeAssign, 'Active assignment exists');
    assert.equal(activeAssign.field_responder, chosenResponder, 'Field responder persists correctly');
    assert.equal(activeAssign.instruction, chosenInstruction, 'Dispatch instruction persists correctly');

    // Verify internal status note is visible to Admin in timeline
    const adminTimeline = reopenedReport.updates || [];
    const internalNoteFound = adminTimeline.some((u) => u.message.includes(e2eInternalNote));
    assert.ok(internalNoteFound, 'Admin timeline must retain internal note');

    // 5. Resident checks the report
    const { getMyIncidentWithDetails } = await import('../lib/data/incidents');
    setTestAuthContext(reporterClerkId);

    const residentView = await getMyIncidentWithDetails(testIncidentId);
    assert.ok(residentView, 'Resident must be able to view their report');

    // Check that resident updates do NOT contain internal note or internal dispatch instruction
    const residentUpdates = residentView.updates || [];
    for (const update of residentUpdates) {
      assert.equal(update.visibility, 'public', 'All updates returned to resident MUST have visibility: public');
      assert.ok(!update.message.includes(e2eInternalNote), 'Internal status note MUST NOT appear in resident timeline');
      assert.ok(!update.message.includes(chosenInstruction), 'Internal dispatch instruction MUST NOT leak into resident timeline');
    }

    // Check that resident assignments view does NOT expose field_responder or instruction
    const residentAssignments = residentView.assignments || [];
    for (const a of residentAssignments) {
      const untyped = a as unknown as Record<string, unknown>;
      assert.equal(untyped.field_responder, undefined, 'Field responder field must NOT be exposed in resident assignments query');
      assert.equal(untyped.instruction, undefined, 'Instruction field must NOT be exposed in resident assignments query');
    }

    // Reset auth context
    setTestAuthContext(null);
  });

  it('9. Reorganized Dispatch & Assignment: Selecting a new status inside Dispatch & Assignment saves and persists upon reopening the report', async () => {
    // Set auth context as Admin
    setTestAuthContext(adminClerkUserId);

    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();
    assert.ok(dept, 'Active department found');

    // Reset incident to under_review so we can test transitioning to in_progress
    await supabase
      .from('incidents')
      .update({ status: 'under_review' })
      .eq('id', testIncidentId);

    const testResponder: FieldResponder = 'Responder 1';
    const testInstruction: DispatchInstruction = 'Coordinate With Relevant Department';
    const testStatusNote = `Dispatch & Assignment consolidated status note #${Date.now()}`;

    // 1. Assign responder and instruction via staff action
    const assignFormData = new FormData();
    assignFormData.append('incident_id', testIncidentId);
    assignFormData.append('department_id', dept.id);
    assignFormData.append('field_responder', testResponder);
    assignFormData.append('instruction', testInstruction);
    assignFormData.append('assignment_note', 'Consolidated dispatch update');

    const { assignIncidentStaffAction, updateStaffIncidentStatusAction } = await import('../app/staff/actions');
    const assignRes = await assignIncidentStaffAction(assignFormData);
    assert.equal(assignRes.success, true, 'Assignment update must succeed');

    // 2. Update status with status change note via staff action (mirroring the consolidated Dispatch & Assignment form)
    const statusFormData = new FormData();
    statusFormData.append('incident_id', testIncidentId);
    statusFormData.append('status', 'in_progress');
    statusFormData.append('status_change_note', testStatusNote);
    statusFormData.append('note', testStatusNote);

    const statusRes = await updateStaffIncidentStatusAction(statusFormData);
    assert.equal(statusRes.success, true, 'Status change inside Dispatch & Assignment must succeed');

    // 3. Reopen the report as Admin and verify persistence
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', adminClerkUserId!)
      .single();
    assert.ok(adminProfile, 'Admin profile exists');

    const reopenedReport = await getStaffIncidentDetails(testIncidentId, adminProfile);
    assert.ok(reopenedReport, 'Reopened report exists');
    assert.equal(reopenedReport.status, 'in_progress', 'Persisted status must match selected new status');

    const activeAssign = reopenedReport.assignments?.find((a) => a.unassigned_at === null);
    assert.ok(activeAssign, 'Active assignment exists');
    assert.equal(activeAssign.field_responder, testResponder, 'Field responder must persist');
    assert.equal(activeAssign.instruction, testInstruction, 'Instruction must persist');

    // 4. Verify status change note is preserved in history
    const updates = reopenedReport.updates || [];
    const noteFound = updates.some((u) => u.message.includes(testStatusNote));
    assert.ok(noteFound, 'Status change note must be stored in incident update history');

    // Reset auth context
    setTestAuthContext(null);
  });

  it('10. Combined Dispatch & Assignment: Assigning responder + instruction + new status simultaneously via unified action workflow', async () => {
    // Set auth context as Admin
    setTestAuthContext(adminClerkUserId);

    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();
    assert.ok(dept, 'Active department found');

    // Reset incident to submitted
    await supabase
      .from('incidents')
      .update({ status: 'submitted' })
      .eq('id', testIncidentId);

    const chosenResponder: FieldResponder = 'Responder 3';
    const chosenInstruction: DispatchInstruction = 'Inspect Incident Location';
    const statusNoteText = `Simultaneous dispatch + status transition test #${Date.now()}`;

    const { assignIncidentStaffAction, updateStaffIncidentStatusAction } = await import('../app/staff/actions');

    // 1. Assign responder with skip_status_update: 'true' (as sent by AssignmentForm when status is also changing)
    const assignFormData = new FormData();
    assignFormData.append('incident_id', testIncidentId);
    assignFormData.append('department_id', dept.id);
    assignFormData.append('field_responder', chosenResponder);
    assignFormData.append('instruction', chosenInstruction);
    assignFormData.append('assignment_note', statusNoteText);
    assignFormData.append('skip_status_update', 'true');

    const assignRes = await assignIncidentStaffAction(assignFormData);
    assert.equal(assignRes.success, true, `Assignment action must succeed: ${assignRes.error}`);

    // 2. Change status to under_review
    const statusFormData = new FormData();
    statusFormData.append('incident_id', testIncidentId);
    statusFormData.append('status', 'under_review');
    statusFormData.append('status_change_note', statusNoteText);
    statusFormData.append('note', statusNoteText);

    const statusRes = await updateStaffIncidentStatusAction(statusFormData);
    assert.equal(statusRes.success, true, 'Status change to under_review must succeed');

    // 3. Verify reopened report state
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', adminClerkUserId!)
      .single();

    assert.ok(adminProfile, 'Admin profile exists');
    const reopenedReport = await getStaffIncidentDetails(testIncidentId, adminProfile!);
    assert.ok(reopenedReport, 'Report exists');
    assert.equal(reopenedReport.status, 'under_review', 'Status must be under_review');

    const activeAssign = reopenedReport.assignments?.find((a) => a.unassigned_at === null);
    assert.ok(activeAssign, 'Active assignment exists');
    assert.equal(activeAssign.field_responder, chosenResponder, 'Field responder persists');
    assert.equal(activeAssign.instruction, chosenInstruction, 'Dispatch instruction persists');

    // 4. Verify audit log entry
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_id', testIncidentId)
      .order('created_at', { ascending: false });

    assert.ok(auditLogs && auditLogs.length > 0, 'Audit logs must exist for incident');
    const hasStatusLog = auditLogs.some((l) => l.action === 'incident_status_changed');
    const hasAssignLog = auditLogs.some((l) => l.action === 'incident_assigned');
    assert.ok(hasStatusLog, 'Audit log must record incident_status_changed');
    assert.ok(hasAssignLog, 'Audit log must record incident_assigned');

    setTestAuthContext(null);
  });

  it('11. Security & Validation: Rejects unauthorized callers and invalid status transitions with clear errors', async () => {
    // 1. Resident role trying to perform assignment
    const { data: resident } = await supabase
      .from('profiles')
      .select('clerk_user_id')
      .eq('role', 'resident')
      .limit(1)
      .single();

    if (resident) {
      setTestAuthContext(resident.clerk_user_id);
      const { assignIncidentStaffAction, updateStaffIncidentStatusAction } = await import('../app/staff/actions');

      const unauthFormData = new FormData();
      unauthFormData.append('incident_id', testIncidentId);
      unauthFormData.append('field_responder', 'Responder 1');

      const unauthAssignRes = await assignIncidentStaffAction(unauthFormData);
      assert.equal(unauthAssignRes.success, false, 'Resident must NOT be permitted to assign responder');
      assert.match(unauthAssignRes.error || '', /Forbidden/, 'Must return Forbidden error');

      const unauthStatusFormData = new FormData();
      unauthStatusFormData.append('incident_id', testIncidentId);
      unauthStatusFormData.append('status', 'in_progress');

      const unauthStatusRes = await updateStaffIncidentStatusAction(unauthStatusFormData);
      assert.equal(unauthStatusRes.success, false, 'Resident must NOT be permitted to change workflow status');
      assert.match(unauthStatusRes.error || '', /Forbidden/, 'Must return Forbidden error');
    }

    // 2. Admin attempting an illegal status transition (e.g. submitted directly to closed)
    setTestAuthContext(adminClerkUserId);
    await supabase.from('incidents').update({ status: 'submitted' }).eq('id', testIncidentId);

    const { updateStaffIncidentStatusAction } = await import('../app/staff/actions');
    const invalidTransitionFormData = new FormData();
    invalidTransitionFormData.append('incident_id', testIncidentId);
    invalidTransitionFormData.append('status', 'closed');

    const invalidRes = await updateStaffIncidentStatusAction(invalidTransitionFormData);
    assert.equal(invalidRes.success, false, 'Illegal transition directly from submitted to closed must fail');
    assert.match(invalidRes.error || '', /Invalid transition/i, 'Must return clear invalid transition message');

    setTestAuthContext(null);
  });
});

