-- ==============================================================================
-- Butuan Report — Fix Function Execute Permissions for Anon & Authenticated Roles
-- 20261002000004_fix_function_permissions.sql
-- ==============================================================================

-- 1. Ensure public helper functions exist with SECURITY DEFINER
create or replace function public.current_clerk_user_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select nullif(auth.jwt()->>'sub', '')::text;
$$;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where clerk_user_id = public.current_clerk_user_id() limit 1;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where clerk_user_id = public.current_clerk_user_id() limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('responder', 'dispatcher', 'admin'), false);
$$;

create or replace function public.is_dispatcher_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('dispatcher', 'admin'), false);
$$;

-- 2. Grant EXECUTE permissions on all auth helpers to anon, authenticated, and service_role
grant execute on function public.current_clerk_user_id() to anon, authenticated, service_role;
grant execute on function public.current_profile_id() to anon, authenticated, service_role;
grant execute on function public.current_user_role() to anon, authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.is_staff() to anon, authenticated, service_role;
grant execute on function public.is_dispatcher_or_admin() to anon, authenticated, service_role;

-- 3. If app_auth schema is present, grant execute permissions there as well
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'app_auth') then
    grant usage on schema app_auth to anon, authenticated, service_role;
    grant execute on all functions in schema app_auth to anon, authenticated, service_role;
  end if;
end $$;

-- 4. Re-apply clean public read policies on incident_categories and departments
alter table public.incident_categories enable row level security;
drop policy if exists "categories_select_active_or_staff" on public.incident_categories;
create policy "categories_select_active_or_staff"
on public.incident_categories for select
using (is_active = true or public.is_staff());

alter table public.departments enable row level security;
drop policy if exists "departments_select_active_or_staff" on public.departments;
create policy "departments_select_active_or_staff"
on public.departments for select
using (is_active = true or public.is_staff());
