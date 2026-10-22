import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  DISPATCH_VEHICLES,
  type DispatchVehicle,
} from '../types';
import { createAdminSupabaseClient } from '../lib/supabase/server';
import { setTestAuthContext } from '../lib/data/profiles';
import { adminAssignIncidentAction } from '../app/admin/actions';
import { assignIncidentStaffAction } from '../app/staff/actions';
import { getStaffIncidentDetails } from '../lib/data/staff';
import { getMyIncidentWithDetails } from '../lib/data/incidents';

describe('Butuan Report — Add Dispatch Vehicle Selector Verification', () => {
  const supabase = createAdminSupabaseClient();
  let adminClerkUserId: string | null = null;
  let testIncidentId: string;
  let residentProfileId: string | null = null;
  let residentClerkUserId: string | null = null;

  before(async () => {
    // 1. Locate or create admin profile
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
          clerk_user_id: 'test_admin_dispatch_vehicle_clerk_id',
          full_name: 'Test Vehicle Admin',
          role: 'admin',
        })
        .select()
        .single();
      adminClerkUserId = newAdmin!.clerk_user_id;
    }

    setTestAuthContext(adminClerkUserId);

    // 2. Locate or create a test resident profile
    const { data: resident } = await supabase
      .from('profiles')
      .select('id, clerk_user_id')
      .eq('role', 'resident')
      .limit(1)
      .maybeSingle();

    if (resident) {
      residentProfileId = resident.id;
      residentClerkUserId = resident.clerk_user_id;
    } else {
      const { data: newRes } = await supabase
        .from('profiles')
        .insert({
          clerk_user_id: 'test_resident_vehicle_checker_id',
          full_name: 'Test Resident Viewer',
          role: 'resident',
          barangay: 'Doongan',
        })
        .select()
        .single();
      residentProfileId = newRes!.id;
      residentClerkUserId = newRes!.clerk_user_id;
    }

    // 3. Create dedicated test incident with resident as reporter
    const { data: cat } = await supabase
      .from('incident_categories')
      .select('id')
      .limit(1)
      .single();

    assert.ok(cat, 'Category must exist');

    const { data: newInc } = await supabase
      .from('incidents')
      .insert({
        title: '[TEST] Vehicle Selection Incident',
        description: 'Validating vehicle assignment',
        barangay: 'Doongan',
        status: 'submitted',
        severity: 'medium',
        reporter_id: residentProfileId!,
        category_id: cat.id,
      })
      .select()
      .single();

    assert.ok(newInc, 'Test incident must be created');
    testIncidentId = newInc.id;
  });

  after(async () => {
    setTestAuthContext(null);
    if (testIncidentId) {
      await supabase.from('incident_assignments').delete().eq('incident_id', testIncidentId);
      await supabase.from('incident_updates').delete().eq('incident_id', testIncidentId);
      await supabase.from('incidents').delete().eq('id', testIncidentId);
    }
  });

  it('1. DISPATCH_VEHICLES contains exactly Vehicle 1 through Vehicle 5', () => {
    assert.deepEqual(
      [...DISPATCH_VEHICLES],
      ['Vehicle 1', 'Vehicle 2', 'Vehicle 3', 'Vehicle 4', 'Vehicle 5'],
      'DISPATCH_VEHICLES must contain exactly Vehicle 1 to Vehicle 5'
    );
    assert.equal(DISPATCH_VEHICLES.length, 5);
  });

  it('2. Server validation rejects invalid/free-text vehicle values (adminAssignIncidentAction)', async () => {
    setTestAuthContext(adminClerkUserId);

    // Free text input attempts
    const invalidAdminRes = await adminAssignIncidentAction({
      incidentId: testIncidentId,
      dispatchVehicle: 'Fire Truck Alpha' as unknown as DispatchVehicle,
    });
    assert.equal(invalidAdminRes.success, false);
    assert.match(invalidAdminRes.error || '', /Invalid dispatch vehicle/i);

    const invalidAdminRes2 = await adminAssignIncidentAction({
      incidentId: testIncidentId,
      dispatchVehicle: 'Vehicle 6' as unknown as DispatchVehicle,
    });
    assert.equal(invalidAdminRes2.success, false);
    assert.match(invalidAdminRes2.error || '', /Invalid dispatch vehicle/i);
  });

  it('3. Server validation rejects invalid/free-text vehicle values (assignIncidentStaffAction)', async () => {
    setTestAuthContext(adminClerkUserId);

    const formData = new FormData();
    formData.append('incident_id', testIncidentId);
    formData.append('dispatch_vehicle', 'Ambulance 99');

    const invalidStaffRes = await assignIncidentStaffAction(formData);
    assert.equal(invalidStaffRes.success, false);
    assert.match(invalidStaffRes.error || '', /Invalid dispatch vehicle/i);
  });

  it('4. Admin can assign Vehicle 1; selection saves and persists upon reloading report', async () => {
    setTestAuthContext(adminClerkUserId);

    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    assert.ok(dept, 'Active department must exist');

    const assignRes = await adminAssignIncidentAction({
      incidentId: testIncidentId,
      departmentId: dept.id,
      dispatchVehicle: 'Vehicle 1',
      fieldResponder: 'Responder 2',
      assignmentNote: 'Vehicle assignment verification test',
    });

    assert.equal(assignRes.success, true, `Assignment must succeed: ${assignRes.error}`);

    // Fetch incident details as staff/admin
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', adminClerkUserId!)
      .single();

    const details = await getStaffIncidentDetails(testIncidentId, adminProfile!);
    assert.ok(details, 'Incident details must load');

    const activeAssignment = details.assignments?.find((a) => a.unassigned_at === null);
    assert.ok(activeAssignment, 'Active assignment must exist');
    assert.equal(activeAssignment.dispatch_vehicle, 'Vehicle 1', 'Dispatch vehicle must be Vehicle 1');
    assert.equal(activeAssignment.field_responder, 'Responder 2', 'Field responder must remain intact');
  });

  it('5. Changing the vehicle updates the correct incident (Vehicle 1 -> Vehicle 4)', async () => {
    setTestAuthContext(adminClerkUserId);

    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    assert.ok(dept, 'Active department must exist');

    // Update vehicle to Vehicle 4
    const formData = new FormData();
    formData.append('incident_id', testIncidentId);
    formData.append('department_id', dept.id);
    formData.append('field_responder', 'Responder 3');
    formData.append('dispatch_vehicle', 'Vehicle 4');

    const updateRes = await assignIncidentStaffAction(formData);
    assert.equal(updateRes.success, true, `Staff vehicle update must succeed: ${updateRes.error}`);

    // Verify on reload
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', adminClerkUserId!)
      .single();

    const reloaded = await getStaffIncidentDetails(testIncidentId, adminProfile!);
    assert.ok(reloaded, 'Must reload details');

    const activeAssignment = reloaded.assignments?.find((a) => a.unassigned_at === null);
    assert.ok(activeAssignment, 'Active assignment must exist');
    assert.equal(activeAssignment.dispatch_vehicle, 'Vehicle 4', 'Updated vehicle must be Vehicle 4');
    assert.equal(activeAssignment.field_responder, 'Responder 3', 'Field responder must be Responder 3');
  });

  it('6. Existing responder and status assignments still work alongside vehicle assignment', async () => {
    setTestAuthContext(adminClerkUserId);

    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    assert.ok(dept, 'Active department must exist');

    const assignRes = await adminAssignIncidentAction({
      incidentId: testIncidentId,
      departmentId: dept.id,
      fieldResponder: 'Responder 5',
      dispatchVehicle: 'Vehicle 5',
    });

    assert.equal(assignRes.success, true);

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', adminClerkUserId!)
      .single();

    const details = await getStaffIncidentDetails(testIncidentId, adminProfile!);
    const active = details?.assignments?.find((a) => a.unassigned_at === null);
    assert.equal(active?.field_responder, 'Responder 5');
    assert.equal(active?.dispatch_vehicle, 'Vehicle 5');
  });

  it('7. Resident views NEVER expose internal dispatch details (responder or vehicle)', async () => {
    // Switch to resident context
    if (residentClerkUserId) {
      setTestAuthContext(residentClerkUserId);

      const residentIncident = await getMyIncidentWithDetails(testIncidentId);
      assert.ok(residentIncident, 'Resident must be able to view their report');

      // Check assignments array on resident view: must not expose field_responder or dispatch_vehicle
      if (residentIncident.assignments && residentIncident.assignments.length > 0) {
        for (const a of residentIncident.assignments) {
          assert.equal(
            (a as unknown as Record<string, unknown>).field_responder,
            undefined,
            'Resident assignment view must never have field_responder'
          );
          assert.equal(
            (a as unknown as Record<string, unknown>).dispatch_vehicle,
            undefined,
            'Resident assignment view must never have dispatch_vehicle'
          );
        }
      }

      // Check updates on resident view: internal dispatch update messages must not appear
      if (residentIncident.updates && residentIncident.updates.length > 0) {
        for (const u of residentIncident.updates) {
          assert.equal(u.visibility, 'public', 'All updates visible to resident must be public');
          assert.equal(
            u.message.includes('Dispatch Vehicle:'),
            false,
            'Resident updates must not contain internal dispatch vehicle notices'
          );
          assert.equal(
            u.message.includes('Field Responder:'),
            false,
            'Resident updates must not contain internal field responder notices'
          );
        }
      }
    }
  });

  it('8. Unauthorized callers (residents) cannot assign or change vehicles', async () => {
    if (residentClerkUserId) {
      setTestAuthContext(residentClerkUserId);

      const unauthFormData = new FormData();
      unauthFormData.append('incident_id', testIncidentId);
      unauthFormData.append('dispatch_vehicle', 'Vehicle 2');

      const res = await assignIncidentStaffAction(unauthFormData);
      assert.equal(res.success, false, 'Resident must be forbidden from assigning vehicles');
      assert.match(res.error || '', /Forbidden/i);
    }
  });
});
