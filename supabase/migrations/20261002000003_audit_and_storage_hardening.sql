-- Migration: 20261002000003_audit_and_storage_hardening.sql
-- Description: 
-- 1. Prevent normal residents from inserting arbitrary audit-log records; restrict audit insertions to admin / trusted server operations; preserve append-only immutability.
-- 2. Restrict incident attachments so users can only upload to incidents they are authorized to access; prevent path/incident ID tampering; enforce private bucket rules.

-- ==============================================================================
-- 1. AUDIT LOGS SECURITY HARDENING
-- ==============================================================================

-- Remove previous policy that permitted ordinary authenticated users/residents to insert audit records
drop policy if exists "audit_insert_authorized" on public.audit_logs;
drop policy if exists "audit_insert_admin_only" on public.audit_logs;
drop policy if exists "audit_insert_admin_or_server" on public.audit_logs;

-- Only admins (or trusted server-side service_role which bypasses RLS) can insert into audit_logs.
-- Normal residents are strictly prevented from inserting arbitrary audit logs.
create policy "audit_insert_admin_only"
on public.audit_logs for insert
with check (
  app_auth.is_admin()
);

-- Ensure audit_logs remains strictly append-only: no UPDATE or DELETE policies are granted.
drop policy if exists "audit_update_policy" on public.audit_logs;
drop policy if exists "audit_delete_policy" on public.audit_logs;


-- ==============================================================================
-- 2. INCIDENT ATTACHMENTS & STORAGE HARDENING
-- ==============================================================================

-- Ensure bucket configuration is private, 10MB limit, strictly controlled MIME types
update storage.buckets
set
  public = false,
  file_size_limit = 10485760, -- 10 MB in bytes
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/gif',
    'application/pdf'
  ]
where id = 'incident-attachments';

-- Security helper: Check if caller can upload to a specific storage path
create or replace function app_auth.can_upload_to_incident(storage_path text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_incident_id uuid;
  first_segment text;
begin
  -- Must be an authenticated user with a profile
  if app_auth.current_profile_id() is null then
    return false;
  end if;

  -- Extract top-level folder name (expected to be incident UUID)
  first_segment := (storage.foldername(storage_path))[1];
  if first_segment is null or first_segment = '' then
    return false;
  end if;

  -- Strictly validate UUID formatting to prevent SQL injection or path traversal
  if first_segment !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;

  target_incident_id := first_segment::uuid;

  -- Staff members can upload attachments to any existing incident
  if app_auth.is_staff() then
    return exists (
      select 1 from public.incidents where id = target_incident_id
    );
  end if;

  -- Residents can only upload to their own incidents that are active / not closed or rejected
  return exists (
    select 1 from public.incidents
    where id = target_incident_id
    and reporter_id = app_auth.current_profile_id()
    and status in ('submitted', 'under_review', 'assigned', 'in_progress')
  );
end;
$$;

-- Security helper: Check if caller can read attachment from a specific storage path
create or replace function app_auth.can_read_incident_attachment(storage_path text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_incident_id uuid;
  first_segment text;
begin
  -- Staff members can read all incident attachments
  if app_auth.is_staff() then
    return true;
  end if;

  -- Must be authenticated
  if app_auth.current_profile_id() is null then
    return false;
  end if;

  first_segment := (storage.foldername(storage_path))[1];
  if first_segment is not null and first_segment ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    target_incident_id := first_segment::uuid;
    if exists (
      select 1 from public.incidents
      where id = target_incident_id
      and reporter_id = app_auth.current_profile_id()
    ) then
      return true;
    end if;
  end if;

  -- Fallback check against incident_attachments metadata table
  return exists (
    select 1 from public.incident_attachments a
    join public.incidents i on i.id = a.incident_id
    where a.storage_path = storage_path
    and i.reporter_id = app_auth.current_profile_id()
  );
end;
$$;

-- Security helper: Check if caller can delete an attachment
create or replace function app_auth.can_delete_incident_attachment(storage_path text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_incident_id uuid;
  first_segment text;
begin
  -- Admin can delete attachments
  if app_auth.is_admin() then
    return true;
  end if;

  -- Must be authenticated
  if app_auth.current_profile_id() is null then
    return false;
  end if;

  first_segment := (storage.foldername(storage_path))[1];
  if first_segment is not null and first_segment ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    target_incident_id := first_segment::uuid;
    -- Resident uploader can only delete if the report is still in 'submitted' status
    if exists (
      select 1 from public.incidents
      where id = target_incident_id
      and reporter_id = app_auth.current_profile_id()
      and status = 'submitted'
    ) then
      return true;
    end if;
  end if;

  return exists (
    select 1 from public.incident_attachments a
    join public.incidents i on i.id = a.incident_id
    where a.storage_path = storage_path
    and a.uploader_id = app_auth.current_profile_id()
    and i.status = 'submitted'
  );
end;
$$;

-- Grant EXECUTE on new helper functions to authenticated role only
grant execute on function app_auth.can_upload_to_incident(text) to authenticated, service_role;
revoke execute on function app_auth.can_upload_to_incident(text) from public, anon;

grant execute on function app_auth.can_read_incident_attachment(text) to authenticated, service_role;
revoke execute on function app_auth.can_read_incident_attachment(text) from public, anon;

grant execute on function app_auth.can_delete_incident_attachment(text) to authenticated, service_role;
revoke execute on function app_auth.can_delete_incident_attachment(text) from public, anon;

-- Apply updated RLS policies to storage.objects
drop policy if exists "incident_attachments_upload_policy" on storage.objects;
create policy "incident_attachments_upload_policy"
on storage.objects for insert
with check (
  bucket_id = 'incident-attachments'
  and app_auth.can_upload_to_incident(storage.objects.name)
);

drop policy if exists "incident_attachments_read_policy" on storage.objects;
create policy "incident_attachments_read_policy"
on storage.objects for select
using (
  bucket_id = 'incident-attachments'
  and app_auth.can_read_incident_attachment(storage.objects.name)
);

drop policy if exists "incident_attachments_delete_policy" on storage.objects;
create policy "incident_attachments_delete_policy"
on storage.objects for delete
using (
  bucket_id = 'incident-attachments'
  and app_auth.can_delete_incident_attachment(storage.objects.name)
);

-- Harden incident_attachments table insert policy to prevent path / incident ID mismatch tampering
drop policy if exists "attachments_insert_authorized" on public.incident_attachments;
create policy "attachments_insert_authorized"
on public.incident_attachments for insert
with check (
  uploader_id = app_auth.current_profile_id()
  and storage_path like (incident_id::text || '/%')
  and (
    -- Resident can upload to their own active incident
    exists (
      select 1 from public.incidents i
      where i.id = incident_attachments.incident_id
      and i.reporter_id = app_auth.current_profile_id()
      and i.status in ('submitted', 'under_review', 'assigned', 'in_progress')
    )
    -- Staff can attach to any incident
    or app_auth.is_staff()
  )
);
