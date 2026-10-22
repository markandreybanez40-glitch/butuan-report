import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createAdminSupabaseClient } from '../lib/supabase/server';
import { getActiveDepartments } from '../lib/data/departments';
import { getAssignableStaff, getFieldRespondersByDepartment } from '../lib/data/staff';

describe('Field Responder Assignment for Every Department', () => {
  const supabase = createAdminSupabaseClient();

  it('1. Department and Field Responder associations exist in Supabase', async () => {
    const departments = await getActiveDepartments();
    assert.ok(departments.length >= 6, `Expected at least 6 active departments, found ${departments.length}`);

    const allStaff = await getAssignableStaff();
    assert.ok(allStaff.length > 0, 'Expected assignable staff in Supabase');

    // Test each department
    for (const dept of departments) {
      const responders = await getFieldRespondersByDepartment(dept.id);
      console.log(`Department: [${dept.name}] -> ${responders.length} eligible Field Responder(s)`);
      
      if (responders.length > 0) {
        for (const responder of responders) {
          assert.equal(responder.department_id, dept.id, `Responder ${responder.full_name} should belong to department ${dept.name}`);
          assert.ok(
            responder.role === 'responder' || responder.role === 'staff' || responder.role === 'admin' || responder.role === 'dispatcher',
            `Responder role should be responder/staff/admin/dispatcher, got ${responder.role}`
          );
        }
      }
    }
  });

  it('2. Correctly handles a department with NO eligible responders', async () => {
    const departments = await getActiveDepartments();
    const trafficDept = departments.find(d => d.name.toLowerCase().includes('traffic') || d.name.toLowerCase().includes('utilities'));
    
    assert.ok(trafficDept, 'Expected Public Utilities and Traffic Management Office to exist');
    const responders = await getFieldRespondersByDepartment(trafficDept!.id);
    
    // As verified during setup, this department has 0 assigned field responders
    assert.equal(responders.length, 0, `Expected 0 responders for ${trafficDept!.name}, got ${responders.length}`);
    console.log(`Verified empty-state department: ${trafficDept!.name} has 0 responders`);
  });

  it('3. Assign and reassign a report, persisting in Supabase and tracking history', async () => {
    // 1. Get an existing incident or use a test one
    const { data: incident, error: incError } = await supabase
      .from('incidents')
      .select('id, report_number, status')
      .limit(1)
      .single();

    assert.ok(!incError && incident, `Failed to fetch test incident: ${incError?.message}`);
    const incidentId = incident.id;
    console.log(`Testing with incident: ${incident.report_number} (${incidentId})`);

    // 2. Find CDRRMO and its responder
    const departments = await getActiveDepartments();
    const cdrrmo = departments.find(d => d.name.toUpperCase().includes('CDRRMO'));
    assert.ok(cdrrmo, 'CDRRMO department found');
    const cdrrmoResponders = await getFieldRespondersByDepartment(cdrrmo!.id);
    assert.ok(cdrrmoResponders.length > 0, 'CDRRMO should have at least 1 responder');
    const cdrrmoResponder = cdrrmoResponders[0];

    // Find an admin user to act as assigner
    const { data: adminUser } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('role', 'admin')
      .limit(1)
      .single();
    assert.ok(adminUser, 'Admin profile found');

    const now1 = new Date().toISOString();

    // 3. Mark any previous assignments as unassigned
    await supabase
      .from('incident_assignments')
      .update({ unassigned_at: now1 })
      .eq('incident_id', incidentId)
      .is('unassigned_at', null);

    // Perform Assignment to CDRRMO + Responder
    const { data: assignRecord1, error: assignError1 } = await supabase
      .from('incident_assignments')
      .insert({
        incident_id: incidentId,
        department_id: cdrrmo!.id,
        assigned_user_id: cdrrmoResponder.id,
        assigned_by: adminUser.id,
      })
      .select()
      .single();

    assert.ok(!assignError1 && assignRecord1, `Assignment failed: ${assignError1?.message}`);

    // Verify active assignment in Supabase
    const { data: activeAssignment1 } = await supabase
      .from('incident_assignments')
      .select('id, department_id, assigned_user_id, unassigned_at')
      .eq('incident_id', incidentId)
      .is('unassigned_at', null)
      .single();

    assert.equal(activeAssignment1?.department_id, cdrrmo!.id, 'Active assignment department_id should match CDRRMO');
    assert.equal(activeAssignment1?.assigned_user_id, cdrrmoResponder.id, 'Active assignment assigned_user_id should match CDRRMO responder');

    // 4. Perform Reassignment to CEO and CEO Responder
    const ceo = departments.find(d => d.name.toUpperCase().includes('ENGINEER') || d.name.toUpperCase().includes('CEO'));
    assert.ok(ceo, 'CEO department found');
    const ceoResponders = await getFieldRespondersByDepartment(ceo!.id);
    assert.ok(ceoResponders.length > 0, 'CEO should have at least 1 responder');
    const ceoResponder = ceoResponders[0];

    const now2 = new Date().toISOString();
    // Mark previous assignment unassigned
    await supabase
      .from('incident_assignments')
      .update({ unassigned_at: now2 })
      .eq('incident_id', incidentId)
      .is('unassigned_at', null);

    // Insert new assignment
    const { data: assignRecord2, error: assignError2 } = await supabase
      .from('incident_assignments')
      .insert({
        incident_id: incidentId,
        department_id: ceo!.id,
        assigned_user_id: ceoResponder.id,
        assigned_by: adminUser.id,
      })
      .select()
      .single();

    assert.ok(!assignError2 && assignRecord2, `Reassignment failed: ${assignError2?.message}`);

    // Verify active reassignment
    const { data: activeAssignment2 } = await supabase
      .from('incident_assignments')
      .select('id, department_id, assigned_user_id, unassigned_at')
      .eq('incident_id', incidentId)
      .is('unassigned_at', null)
      .single();

    assert.equal(activeAssignment2?.department_id, ceo!.id, 'Active assignment department_id should match CEO');
    assert.equal(activeAssignment2?.assigned_user_id, ceoResponder.id, 'Active assignment assigned_user_id should match CEO responder');

    // 5. Verify assignment history was recorded and preserved
    const { data: history } = await supabase
      .from('incident_assignments')
      .select('*')
      .eq('incident_id', incidentId)
      .order('assigned_at', { ascending: false });

    assert.ok(history && history.length >= 2, 'Assignment history should have at least 2 entries');
    console.log(`Verified assignment history has ${history.length} records for incident ${incident.report_number}`);
  });
});
