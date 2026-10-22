-- ==============================================================================
-- Butuan Report — Dispatch Vehicle Selector (Vehicle 1–5)
-- 20261021000000_add_dispatch_vehicle.sql
-- ==============================================================================

-- 1. Add dispatch_vehicle column to incident_assignments
alter table public.incident_assignments
  add column if not exists dispatch_vehicle text;

-- 2. Restrict dispatch_vehicle strictly to Vehicle 1 through Vehicle 5
alter table public.incident_assignments
  drop constraint if exists incident_assignments_dispatch_vehicle_check;

alter table public.incident_assignments
  add constraint incident_assignments_dispatch_vehicle_check
  check (dispatch_vehicle is null or dispatch_vehicle in (
    'Vehicle 1',
    'Vehicle 2',
    'Vehicle 3',
    'Vehicle 4',
    'Vehicle 5'
  ));

-- 3. Create index for fast vehicle lookups
create index if not exists idx_assignments_dispatch_vehicle
  on public.incident_assignments(dispatch_vehicle)
  where dispatch_vehicle is not null;
