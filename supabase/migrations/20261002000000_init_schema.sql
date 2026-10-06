-- ==============================================================================
-- Butuan Report — Database Foundation Migration
-- 20261002000000_init_schema.sql
-- ==============================================================================

-- 1. Helper Extensions
create extension if not exists "pgcrypto";

-- 2. Report Number Sequence & Function
create sequence if not exists public.incident_report_seq;

create or replace function public.generate_report_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  today_prefix text;
  seq_val bigint;
begin
  today_prefix := 'BR-' || to_char(now() at time zone 'Asia/Manila', 'YYYYMMDD') || '-';
  seq_val := nextval('public.incident_report_seq');
  return today_prefix || lpad(seq_val::text, 5, '0');
end;
$$;

-- 3. Trigger for updated_at
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ==============================================================================
-- TABLES
-- ==============================================================================

-- Table 1: profiles
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  full_name text not null,
  phone text,
  barangay text,
  role text not null default 'resident',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('resident', 'responder', 'dispatcher', 'admin'))
);

create trigger update_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

-- Table 2: departments
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger update_departments_updated_at
before update on public.departments
for each row execute function public.update_updated_at_column();

-- Table 3: incident_categories
create table public.incident_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger update_incident_categories_updated_at
before update on public.incident_categories
for each row execute function public.update_updated_at_column();

-- Table 4: incidents
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  report_number text not null unique default public.generate_report_number(),
  reporter_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  description text not null,
  category_id uuid not null references public.incident_categories(id) on delete restrict,
  severity text not null default 'medium',
  status text not null default 'submitted',
  barangay text not null,
  street_area text,
  landmark text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  closed_at timestamptz,
  constraint incidents_severity_check check (severity in ('low', 'medium', 'high', 'critical')),
  constraint incidents_status_check check (status in (
    'submitted',
    'under_review',
    'assigned',
    'in_progress',
    'resolved',
    'closed',
    'rejected',
    'duplicate',
    'cancelled'
  )),
  constraint incidents_latitude_check check (latitude is null or (latitude between -90 and 90)),
  constraint incidents_longitude_check check (longitude is null or (longitude between -180 and 180))
);

create trigger update_incidents_updated_at
before update on public.incidents
for each row execute function public.update_updated_at_column();

-- Table 5: incident_attachments
create table public.incident_attachments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id) on delete restrict,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  file_size bigint not null check (file_size > 0),
  created_at timestamptz not null default now()
);

-- Table 6: incident_assignments
create table public.incident_assignments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  assigned_user_id uuid references public.profiles(id) on delete set null,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  constraint assignment_target_check check (department_id is not null or assigned_user_id is not null)
);

-- Table 7: incident_updates
create table public.incident_updates (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  message text not null,
  visibility text not null default 'public',
  created_at timestamptz not null default now(),
  constraint updates_visibility_check check (visibility in ('public', 'internal'))
);

-- Table 8: notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  related_incident_id uuid references public.incidents(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Table 9: audit_logs
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- INDEXES (Covering Queries & Foreign Keys for Performance)
-- ==============================================================================

-- profiles
create index idx_profiles_clerk_user_id on public.profiles(clerk_user_id);
create index idx_profiles_role on public.profiles(role);

-- incidents
create index idx_incidents_reporter_id on public.incidents(reporter_id);
create index idx_incidents_category_id on public.incidents(category_id);
create index idx_incidents_status on public.incidents(status);
create index idx_incidents_barangay on public.incidents(barangay);
create index idx_incidents_created_at on public.incidents(created_at desc);
create index idx_incidents_status_created on public.incidents(status, created_at desc);

-- incident_attachments
create index idx_attachments_incident_id on public.incident_attachments(incident_id);
create index idx_attachments_uploader_id on public.incident_attachments(uploader_id);

-- incident_assignments
create index idx_assignments_incident_id on public.incident_assignments(incident_id);
create index idx_assignments_dept_id on public.incident_assignments(department_id);
create index idx_assignments_user_id on public.incident_assignments(assigned_user_id);
create index idx_assignments_assigned_by on public.incident_assignments(assigned_by);
create index idx_assignments_active on public.incident_assignments(incident_id, unassigned_at);

-- incident_updates
create index idx_updates_incident_id on public.incident_updates(incident_id);
create index idx_updates_author_id on public.incident_updates(author_id);
create index idx_updates_lookup on public.incident_updates(incident_id, visibility, created_at desc);

-- notifications
create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_incident on public.notifications(related_incident_id);
create index idx_notifications_unread on public.notifications(user_id, read_at);

-- audit_logs
create index idx_audit_actor_id on public.audit_logs(actor_id);
create index idx_audit_entity on public.audit_logs(entity_type, entity_id);
create index idx_audit_created_at on public.audit_logs(created_at desc);

-- ==============================================================================
-- CLERK AUTHENTICATION IDENTITY HELPERS
-- ==============================================================================

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

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. PROFILES
alter table public.profiles enable row level security;

create policy "profiles_select_own_or_staff"
on public.profiles for select
using (
  clerk_user_id = public.current_clerk_user_id()
  or public.is_staff()
);

create policy "profiles_insert_self_or_admin"
on public.profiles for insert
with check (
  (clerk_user_id = public.current_clerk_user_id() and role = 'resident')
  or public.is_admin()
);

create policy "profiles_update_self_or_admin"
on public.profiles for update
using (
  clerk_user_id = public.current_clerk_user_id()
  or public.is_admin()
)
with check (
  (
    clerk_user_id = public.current_clerk_user_id()
    and role = (select p.role from public.profiles p where p.id = profiles.id)
  )
  or public.is_admin()
);

create policy "profiles_delete_admin_only"
on public.profiles for delete
using (public.is_admin());

-- 2. DEPARTMENTS
alter table public.departments enable row level security;

create policy "departments_select_active_or_staff"
on public.departments for select
using (is_active = true or public.is_staff());

create policy "departments_insert_admin"
on public.departments for insert
with check (public.is_admin());

create policy "departments_update_admin"
on public.departments for update
using (public.is_admin())
with check (public.is_admin());

create policy "departments_delete_admin"
on public.departments for delete
using (public.is_admin());

-- 3. INCIDENT CATEGORIES
alter table public.incident_categories enable row level security;

create policy "categories_select_active_or_staff"
on public.incident_categories for select
using (is_active = true or public.is_staff());

create policy "categories_insert_admin"
on public.incident_categories for insert
with check (public.is_admin());

create policy "categories_update_admin"
on public.incident_categories for update
using (public.is_admin())
with check (public.is_admin());

create policy "categories_delete_admin"
on public.incident_categories for delete
using (public.is_admin());

-- 4. INCIDENTS
alter table public.incidents enable row level security;

create policy "incidents_select_reporter_or_staff"
on public.incidents for select
using (
  reporter_id = public.current_profile_id()
  or public.is_staff()
);

create policy "incidents_insert_reporter_or_dispatcher"
on public.incidents for insert
with check (
  (reporter_id = public.current_profile_id() and status = 'submitted')
  or public.is_dispatcher_or_admin()
);

create policy "incidents_update_authorized"
on public.incidents for update
using (
  (reporter_id = public.current_profile_id() and status = 'submitted')
  or (
    public.current_user_role() = 'responder'
    and exists (
      select 1 from public.incident_assignments a
      where a.incident_id = incidents.id
      and a.assigned_user_id = public.current_profile_id()
      and a.unassigned_at is null
    )
  )
  or public.is_dispatcher_or_admin()
)
with check (
  (reporter_id = public.current_profile_id() and status in ('submitted', 'cancelled'))
  or (
    public.current_user_role() = 'responder'
    and exists (
      select 1 from public.incident_assignments a
      where a.incident_id = incidents.id
      and a.assigned_user_id = public.current_profile_id()
      and a.unassigned_at is null
    )
  )
  or public.is_dispatcher_or_admin()
);

create policy "incidents_delete_admin_only"
on public.incidents for delete
using (public.is_admin());

-- 5. INCIDENT ATTACHMENTS
alter table public.incident_attachments enable row level security;

create policy "attachments_select_authorized"
on public.incident_attachments for select
using (
  exists (
    select 1 from public.incidents i
    where i.id = incident_attachments.incident_id
    and (i.reporter_id = public.current_profile_id() or public.is_staff())
  )
);

create policy "attachments_insert_authorized"
on public.incident_attachments for insert
with check (
  uploader_id = public.current_profile_id()
  and exists (
    select 1 from public.incidents i
    where i.id = incident_attachments.incident_id
    and (i.reporter_id = public.current_profile_id() or public.is_staff())
  )
);

create policy "attachments_delete_uploader_or_admin"
on public.incident_attachments for delete
using (
  (
    uploader_id = public.current_profile_id()
    and exists (
      select 1 from public.incidents i
      where i.id = incident_attachments.incident_id
      and i.status = 'submitted'
    )
  )
  or public.is_admin()
);

-- 6. INCIDENT ASSIGNMENTS
alter table public.incident_assignments enable row level security;

create policy "assignments_select_staff_only"
on public.incident_assignments for select
using (public.is_staff());

create policy "assignments_insert_dispatcher_or_admin"
on public.incident_assignments for insert
with check (public.is_dispatcher_or_admin());

create policy "assignments_update_dispatcher_or_admin"
on public.incident_assignments for update
using (public.is_dispatcher_or_admin())
with check (public.is_dispatcher_or_admin());

create policy "assignments_delete_admin_only"
on public.incident_assignments for delete
using (public.is_admin());

-- 7. INCIDENT UPDATES
alter table public.incident_updates enable row level security;

create policy "updates_select_public_or_staff"
on public.incident_updates for select
using (
  (
    visibility = 'public'
    and exists (
      select 1 from public.incidents i
      where i.id = incident_updates.incident_id
      and i.reporter_id = public.current_profile_id()
    )
  )
  or public.is_staff()
);

create policy "updates_insert_authorized"
on public.incident_updates for insert
with check (
  (
    author_id = public.current_profile_id()
    and visibility = 'public'
    and exists (
      select 1 from public.incidents i
      where i.id = incident_updates.incident_id
      and i.reporter_id = public.current_profile_id()
    )
  )
  or (
    author_id = public.current_profile_id()
    and public.is_staff()
  )
);

create policy "updates_update_admin_only"
on public.incident_updates for update
using (public.is_admin());

create policy "updates_delete_admin_only"
on public.incident_updates for delete
using (public.is_admin());

-- 8. NOTIFICATIONS
alter table public.notifications enable row level security;

create policy "notifications_select_own"
on public.notifications for select
using (user_id = public.current_profile_id());

create policy "notifications_insert_staff_or_self"
on public.notifications for insert
with check (public.is_staff() or user_id = public.current_profile_id());

create policy "notifications_update_own"
on public.notifications for update
using (user_id = public.current_profile_id())
with check (user_id = public.current_profile_id());

create policy "notifications_delete_own"
on public.notifications for delete
using (user_id = public.current_profile_id());

-- 9. AUDIT LOGS (Append-only for non-admins, read restricted to admin)
alter table public.audit_logs enable row level security;

create policy "audit_select_admin_only"
on public.audit_logs for select
using (public.is_admin());

create policy "audit_insert_authorized"
on public.audit_logs for insert
with check (
  actor_id = public.current_profile_id()
  or public.is_staff()
);

-- Note: No UPDATE or DELETE policies are granted on audit_logs. It is append-only by design.

-- ==============================================================================
-- INITIAL CONFIGURABLE SEED DATA (Departments & Categories only)
-- ==============================================================================

insert into public.departments (name, description) values
  ('City Disaster Risk Reduction and Management Office (CDRRMO)', 'Emergency disaster operations and quick response coordination'),
  ('City Engineering Office (CEO)', 'Roads, bridges, drainage, and public infrastructure maintenance'),
  ('City Environment and Natural Resources Office (City ENRO)', 'Environmental protection, forestry, and waterway management'),
  ('City General Services Office (CGSO)', 'Public facility upkeep and municipal property sanitation'),
  ('City Health Office (CHO)', 'Public health, sanitation hazards, and biohazard concerns'),
  ('Public Utilities and Traffic Management Office', 'Traffic hazards, traffic signals, and street light maintenance')
on conflict (name) do nothing;

insert into public.incident_categories (name, description) values
  ('Road Hazard', 'Potholes, road damage, open manholes, or street obstructions'),
  ('Flooding', 'Flash floods, overflowed canals, clogged storm drains, and standing water'),
  ('Landslide', 'Soil erosion, slope failure, or rockfalls blocking pathways'),
  ('Fallen Tree', 'Uprooted trees, broken branches obstructing roads or powerlines'),
  ('Earthquake Damage', 'Structural cracks or damages to public infrastructure following tremors'),
  ('Power / Utility', 'Damaged utility poles, exposed wiring, downed powerlines, or pipe bursts'),
  ('Public Facility', 'Damaged public buildings, parks, perimeter walls, or city streetlights'),
  ('Environmental', 'Illegal dumping, hazardous waste, pollution of waterways or wetlands'),
  ('Sanitation', 'Uncollected garbage piles, sewer overflow, or public sanitation risks'),
  ('Other Civic Concern', 'Other community hazards not covered by existing categories')
on conflict (name) do nothing;
