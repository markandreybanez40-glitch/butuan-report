-- ==============================================================================
-- Butuan Report — Profile Department Association
-- 20261002000008_add_profile_department_id.sql
-- ==============================================================================

-- 1. Add department_id to profiles to bind field responders and staff to departments
alter table public.profiles
  add column if not exists department_id uuid references public.departments(id) on delete set null;

-- 2. Create index on department_id for fast departmental lookups
create index if not exists idx_profiles_department_id on public.profiles(department_id);
