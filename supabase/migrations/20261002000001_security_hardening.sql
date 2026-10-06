-- Migration: 20261002000001_security_hardening.sql
-- Description: Move internal auth helper functions to a private schema (app_auth)
-- to avoid exposing internal SECURITY DEFINER functions as public PostgREST RPC endpoints.

-- 1. Create private schema for security helpers
create schema if not exists app_auth;

-- Revoke all permissions on schema app_auth from anon and PUBLIC
revoke all on schema app_auth from public, anon;
grant usage on schema app_auth to authenticated, service_role;

-- 2. Define helper functions in app_auth schema
create or replace function app_auth.current_clerk_user_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select nullif(auth.jwt()->>'sub', '')::text;
$$;

create or replace function app_auth.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where clerk_user_id = app_auth.current_clerk_user_id() limit 1;
$$;

create or replace function app_auth.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where clerk_user_id = app_auth.current_clerk_user_id() limit 1;
$$;

create or replace function app_auth.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(app_auth.current_user_role() = 'admin', false);
$$;

create or replace function app_auth.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(app_auth.current_user_role() in ('responder', 'dispatcher', 'admin'), false);
$$;

create or replace function app_auth.is_dispatcher_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(app_auth.current_user_role() in ('dispatcher', 'admin'), false);
$$;

-- Grant EXECUTE on app_auth functions only to authenticated and service_role
grant execute on all functions in schema app_auth to authenticated, service_role;
revoke execute on all functions in schema app_auth from public, anon;

-- 3. Update RLS policies across all tables to use app_auth functions

-- PROFILES
drop policy if exists "profiles_select_own_or_staff" on public.profiles;
create policy "profiles_select_own_or_staff"
on public.profiles for select
using (
  clerk_user_id = app_auth.current_clerk_user_id()
  or app_auth.is_staff()
);

drop policy if exists "profiles_insert_self_or_admin" on public.profiles;
create policy "profiles_insert_self_or_admin"
on public.profiles for insert
with check (
  (clerk_user_id = app_auth.current_clerk_user_id() and role = 'resident')
  or app_auth.is_admin()
);

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles for update
using (
  clerk_user_id = app_auth.current_clerk_user_id()
  or app_auth.is_admin()
)
with check (
  (
    clerk_user_id = app_auth.current_clerk_user_id()
    and role = (select p.role from public.profiles p where p.id = profiles.id)
  )
  or app_auth.is_admin()
);

drop policy if exists "profiles_delete_admin_only" on public.profiles;
create policy "profiles_delete_admin_only"
on public.profiles for delete
using (app_auth.is_admin());

-- DEPARTMENTS
drop policy if exists "departments_select_active_or_staff" on public.departments;
create policy "departments_select_active_or_staff"
on public.departments for select
using (is_active = true or app_auth.is_staff());

drop policy if exists "departments_insert_admin" on public.departments;
create policy "departments_insert_admin"
on public.departments for insert
with check (app_auth.is_admin());

drop policy if exists "departments_update_admin" on public.departments;
create policy "departments_update_admin"
on public.departments for update
using (app_auth.is_admin())
with check (app_auth.is_admin());

drop policy if exists "departments_delete_admin" on public.departments;
create policy "departments_delete_admin"
on public.departments for delete
using (app_auth.is_admin());

-- INCIDENT CATEGORIES
drop policy if exists "categories_select_active_or_staff" on public.incident_categories;
create policy "categories_select_active_or_staff"
on public.incident_categories for select
using (is_active = true or app_auth.is_staff());

drop policy if exists "categories_insert_admin" on public.incident_categories;
create policy "categories_insert_admin"
on public.incident_categories for insert
with check (app_auth.is_admin());

drop policy if exists "categories_update_admin" on public.incident_categories;
create policy "categories_update_admin"
on public.incident_categories for update
using (app_auth.is_admin())
with check (app_auth.is_admin());

drop policy if exists "categories_delete_admin" on public.incident_categories;
create policy "categories_delete_admin"
on public.incident_categories for delete
using (app_auth.is_admin());

-- INCIDENTS
drop policy if exists "incidents_select_reporter_or_staff" on public.incidents;
create policy "incidents_select_reporter_or_staff"
on public.incidents for select
using (
  reporter_id = app_auth.current_profile_id()
  or app_auth.is_staff()
);

drop policy if exists "incidents_insert_reporter_or_dispatcher" on public.incidents;
create policy "incidents_insert_reporter_or_dispatcher"
on public.incidents for insert
with check (
  (reporter_id = app_auth.current_profile_id() and status = 'submitted')
  or app_auth.is_dispatcher_or_admin()
);

drop policy if exists "incidents_update_authorized" on public.incidents;
create policy "incidents_update_authorized"
on public.incidents for update
using (
  (reporter_id = app_auth.current_profile_id() and status = 'submitted')
  or (
    app_auth.current_user_role() = 'responder'
    and exists (
      select 1 from public.incident_assignments a
      where a.incident_id = incidents.id
      and a.assigned_user_id = app_auth.current_profile_id()
      and a.unassigned_at is null
    )
  )
  or app_auth.is_dispatcher_or_admin()
)
with check (
  (reporter_id = app_auth.current_profile_id() and status in ('submitted', 'cancelled'))
  or (
    app_auth.current_user_role() = 'responder'
    and exists (
      select 1 from public.incident_assignments a
      where a.incident_id = incidents.id
      and a.assigned_user_id = app_auth.current_profile_id()
      and a.unassigned_at is null
    )
  )
  or app_auth.is_dispatcher_or_admin()
);

drop policy if exists "incidents_delete_admin_only" on public.incidents;
create policy "incidents_delete_admin_only"
on public.incidents for delete
using (app_auth.is_admin());

-- INCIDENT ATTACHMENTS
drop policy if exists "attachments_select_authorized" on public.incident_attachments;
create policy "attachments_select_authorized"
on public.incident_attachments for select
using (
  exists (
    select 1 from public.incidents i
    where i.id = incident_attachments.incident_id
    and (i.reporter_id = app_auth.current_profile_id() or app_auth.is_staff())
  )
);

drop policy if exists "attachments_insert_authorized" on public.incident_attachments;
create policy "attachments_insert_authorized"
on public.incident_attachments for insert
with check (
  uploader_id = app_auth.current_profile_id()
  and exists (
    select 1 from public.incidents i
    where i.id = incident_attachments.incident_id
    and (i.reporter_id = app_auth.current_profile_id() or app_auth.is_staff())
  )
);

drop policy if exists "attachments_delete_uploader_or_admin" on public.incident_attachments;
create policy "attachments_delete_uploader_or_admin"
on public.incident_attachments for delete
using (
  (
    uploader_id = app_auth.current_profile_id()
    and exists (
      select 1 from public.incidents i
      where i.id = incident_attachments.incident_id
      and i.status = 'submitted'
    )
  )
  or app_auth.is_admin()
);

-- INCIDENT ASSIGNMENTS
drop policy if exists "assignments_select_staff_only" on public.incident_assignments;
create policy "assignments_select_staff_only"
on public.incident_assignments for select
using (app_auth.is_staff());

drop policy if exists "assignments_insert_dispatcher_or_admin" on public.incident_assignments;
create policy "assignments_insert_dispatcher_or_admin"
on public.incident_assignments for insert
with check (app_auth.is_dispatcher_or_admin());

drop policy if exists "assignments_update_dispatcher_or_admin" on public.incident_assignments;
create policy "assignments_update_dispatcher_or_admin"
on public.incident_assignments for update
using (app_auth.is_dispatcher_or_admin())
with check (app_auth.is_dispatcher_or_admin());

drop policy if exists "assignments_delete_admin_only" on public.incident_assignments;
create policy "assignments_delete_admin_only"
on public.incident_assignments for delete
using (app_auth.is_admin());

-- INCIDENT UPDATES
drop policy if exists "updates_select_public_or_staff" on public.incident_updates;
create policy "updates_select_public_or_staff"
on public.incident_updates for select
using (
  (
    visibility = 'public'
    and exists (
      select 1 from public.incidents i
      where i.id = incident_updates.incident_id
      and i.reporter_id = app_auth.current_profile_id()
    )
  )
  or app_auth.is_staff()
);

drop policy if exists "updates_insert_authorized" on public.incident_updates;
create policy "updates_insert_authorized"
on public.incident_updates for insert
with check (
  (
    author_id = app_auth.current_profile_id()
    and visibility = 'public'
    and exists (
      select 1 from public.incidents i
      where i.id = incident_updates.incident_id
      and i.reporter_id = app_auth.current_profile_id()
    )
  )
  or (
    author_id = app_auth.current_profile_id()
    and app_auth.is_staff()
  )
);

drop policy if exists "updates_update_admin_only" on public.incident_updates;
create policy "updates_update_admin_only"
on public.incident_updates for update
using (app_auth.is_admin());

drop policy if exists "updates_delete_admin_only" on public.incident_updates;
create policy "updates_delete_admin_only"
on public.incident_updates for delete
using (app_auth.is_admin());

-- NOTIFICATIONS
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications for select
using (user_id = app_auth.current_profile_id());

drop policy if exists "notifications_insert_staff_or_self" on public.notifications;
create policy "notifications_insert_staff_or_self"
on public.notifications for insert
with check (app_auth.is_staff() or user_id = app_auth.current_profile_id());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
on public.notifications for update
using (user_id = app_auth.current_profile_id())
with check (user_id = app_auth.current_profile_id());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
on public.notifications for delete
using (user_id = app_auth.current_profile_id());

-- AUDIT LOGS
drop policy if exists "audit_select_admin_only" on public.audit_logs;
create policy "audit_select_admin_only"
on public.audit_logs for select
using (app_auth.is_admin());

drop policy if exists "audit_insert_authorized" on public.audit_logs;
create policy "audit_insert_authorized"
on public.audit_logs for insert
with check (
  actor_id = app_auth.current_profile_id()
  or app_auth.is_staff()
);

-- 4. Drop the old functions from public schema
drop function if exists public.is_staff();
drop function if exists public.is_dispatcher_or_admin();
drop function if exists public.is_admin();
drop function if exists public.current_user_role();
drop function if exists public.current_profile_id();
drop function if exists public.current_clerk_user_id();
