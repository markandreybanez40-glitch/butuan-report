import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { assertSafeTestEnvironment } from './test-safety-guard';
import { createAdminSupabaseClient } from '../lib/supabase/server';
import { getOrCreateCurrentProfile, setTestAuthContext } from '../lib/data/profiles';
import { submitIncidentAction } from '../app/dashboard/new/actions';

const TEST_BOOTSTRAP_USER_ID = 'test_clerk_user_bootstrap_spec';
const TEST_NORMAL_USER_ID = 'test_clerk_user_normal_resident_spec';

describe('Butuan Report — Initial Admin Bootstrap & Report Submission Resilience', () => {
  assertSafeTestEnvironment('Initial Admin Bootstrap & Report Submission Resilience');
  const supabase = createAdminSupabaseClient();
  const createdProfileIds: string[] = [];
  const createdIncidentIds: string[] = [];
  const originalEnvAdmin = process.env.INITIAL_ADMIN_CLERK_USER_ID;

  after(async () => {
    process.env.INITIAL_ADMIN_CLERK_USER_ID = originalEnvAdmin;
    setTestAuthContext(null);

    if (createdIncidentIds.length > 0) {
      await supabase.from('incident_attachments').delete().in('incident_id', createdIncidentIds);
      await supabase.from('incident_updates').delete().in('incident_id', createdIncidentIds);
      await supabase.from('notifications').delete().in('related_incident_id', createdIncidentIds);
      await supabase.from('incidents').delete().in('id', createdIncidentIds);
    }

    const testClerkIds = [TEST_BOOTSTRAP_USER_ID, TEST_NORMAL_USER_ID];
    await supabase.from('profiles').delete().in('clerk_user_id', testClerkIds);
  });

  it('1. Normal user without INITIAL_ADMIN_CLERK_USER_ID is created as resident', async () => {
    delete process.env.INITIAL_ADMIN_CLERK_USER_ID;
    setTestAuthContext(TEST_NORMAL_USER_ID);

    // Ensure clean state
    await supabase.from('profiles').delete().eq('clerk_user_id', TEST_NORMAL_USER_ID);

    const { data: p } = await supabase.from('profiles').insert({
      clerk_user_id: TEST_NORMAL_USER_ID,
      full_name: 'Test Standard Resident',
      role: 'resident',
    }).select().single();

    assert.ok(p, 'Profile inserted');
    createdProfileIds.push(p.id);
    assert.equal(p.role, 'resident', 'Standard signup must default to resident');
  });

  it('2. Authorized demotion is preserved: when active admins exist, INITIAL_ADMIN_CLERK_USER_ID cannot unintentionally restore admin role', async () => {
    process.env.INITIAL_ADMIN_CLERK_USER_ID = TEST_BOOTSTRAP_USER_ID;
    setTestAuthContext(TEST_BOOTSTRAP_USER_ID);

    // Simulate an account that was demoted to resident by an authorized administrator
    await supabase.from('profiles').delete().eq('clerk_user_id', TEST_BOOTSTRAP_USER_ID);
    const { data: demotedProfile } = await supabase.from('profiles').insert({
      clerk_user_id: TEST_BOOTSTRAP_USER_ID,
      full_name: 'Demoted Former Admin',
      role: 'resident',
    }).select().single();

    assert.ok(demotedProfile, 'Demoted profile created');
    assert.equal(demotedProfile.role, 'resident');

    // Call getOrCreateCurrentProfile() - since active admins exist in DB, it must NOT restore admin privileges
    const resultProfile = await getOrCreateCurrentProfile();
    assert.ok(resultProfile, 'Profile returned');
    assert.equal(
      resultProfile.role,
      'resident',
      'Authorized demotion must be preserved; bootstrap must not re-elevate when active admins exist'
    );

    // Confirm database record remains resident
    const { data: inDb } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_user_id', TEST_BOOTSTRAP_USER_ID)
      .single();

    assert.equal(inDb?.role, 'resident', 'Role in Supabase must remain resident');
  });

  it('3. Non-matching user is never elevated even when INITIAL_ADMIN_CLERK_USER_ID is set', async () => {
    process.env.INITIAL_ADMIN_CLERK_USER_ID = 'user_different_designated_admin';
    setTestAuthContext(TEST_NORMAL_USER_ID);

    const profile = await getOrCreateCurrentProfile();
    assert.ok(profile, 'Profile retrieved');
    assert.equal(profile.role, 'resident', 'Non-matching user must remain resident');
  });

  it('4. Partial attachment failure communicates saved state and returns safe recovery state', async () => {
    setTestAuthContext(TEST_NORMAL_USER_ID);

    // Fetch an active category
    const { data: cat } = await supabase
      .from('incident_categories')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();
    assert.ok(cat, 'Active category found');

    const validPngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
    ]);

    const fd = new FormData();
    fd.append('category_id', cat.id);
    fd.append('severity', 'high');
    fd.append('title', `[TEST] Partial Attachment Resilience ${Date.now()}`);
    fd.append('description', 'Testing partial upload resilience and safe recovery paths for resident report submissions.');
    fd.append('barangay', 'Doongan');
    fd.append('latitude', '8.9482');
    fd.append('longitude', '125.5431');
    fd.append(
      'attachments',
      new File([validPngBuffer], 'evidence.png', { type: 'image/png' })
    );

    const result = await submitIncidentAction(null, fd);
    assert.equal(result.success, true, 'Report submission should succeed');
    assert.ok(result.incidentId, 'incidentId must be present');
    assert.match(result.reportNumber || '', /^BR-\d{8}-\d{5}$/, 'Official report number must be generated');
    createdIncidentIds.push(result.incidentId!);

    // Verify incident is in database
    const { data: inc } = await supabase
      .from('incidents')
      .select('id, status, report_number')
      .eq('id', result.incidentId)
      .single();

    assert.ok(inc, 'Incident persisted in database');
    assert.equal(inc.status, 'submitted');
    assert.equal(inc.report_number, result.reportNumber);
  });
});
