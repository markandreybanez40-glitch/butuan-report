-- Migration: 20261002000002_storage_setup.sql
-- Description: Prepare private Supabase Storage bucket and access policies for incident attachments.

-- 1. Create private bucket for incident attachments
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'incident-attachments',
  'incident-attachments',
  false,
  10485760, -- 10 MB limit per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif', 'application/pdf'];

-- 2. Storage RLS Policies on storage.objects

-- Allow authorized reading of attachments: staff or the incident's reporter
drop policy if exists "incident_attachments_read_policy" on storage.objects;
create policy "incident_attachments_read_policy"
on storage.objects for select
using (
  bucket_id = 'incident-attachments'
  and (
    app_auth.is_staff()
    or exists (
      select 1 from public.incident_attachments a
      join public.incidents i on i.id = a.incident_id
      where a.storage_path = storage.objects.name
      and i.reporter_id = app_auth.current_profile_id()
    )
  )
);

-- Allow authenticated users to upload attachments
drop policy if exists "incident_attachments_upload_policy" on storage.objects;
create policy "incident_attachments_upload_policy"
on storage.objects for insert
with check (
  bucket_id = 'incident-attachments'
  and app_auth.current_profile_id() is not null
);

-- Allow deleting attachments only for admin or uploader when report is still 'submitted'
drop policy if exists "incident_attachments_delete_policy" on storage.objects;
create policy "incident_attachments_delete_policy"
on storage.objects for delete
using (
  bucket_id = 'incident-attachments'
  and (
    app_auth.is_admin()
    or exists (
      select 1 from public.incident_attachments a
      join public.incidents i on i.id = a.incident_id
      where a.storage_path = storage.objects.name
      and a.uploader_id = app_auth.current_profile_id()
      and i.status = 'submitted'
    )
  )
);
