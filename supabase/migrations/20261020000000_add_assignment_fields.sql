-- ==============================================================================
-- Butuan Report — Field Responder (Responder 1–5) & Internal Dispatch Instruction
-- 20261020000000_add_assignment_fields.sql
-- ==============================================================================

-- 1. Add field_responder and instruction columns to incident_assignments
alter table public.incident_assignments
  add column if not exists field_responder text,
  add column if not exists instruction text;

-- 2. Update assignment_target_check to allow department_id, assigned_user_id, or field_responder
alter table public.incident_assignments
  drop constraint if exists assignment_target_check;

alter table public.incident_assignments
  add constraint assignment_target_check
  check (department_id is not null or assigned_user_id is not null or field_responder is not null);

-- 3. Restrict field_responder strictly to Responder 1 through Responder 5
alter table public.incident_assignments
  drop constraint if exists incident_assignments_field_responder_check;

alter table public.incident_assignments
  add constraint incident_assignments_field_responder_check
  check (field_responder is null or field_responder in (
    'Responder 1',
    'Responder 2',
    'Responder 3',
    'Responder 4',
    'Responder 5'
  ));

-- 4. Restrict instruction strictly to predefined municipal dispatch instructions
alter table public.incident_assignments
  drop constraint if exists incident_assignments_instruction_check;

alter table public.incident_assignments
  add constraint incident_assignments_instruction_check
  check (instruction is null or instruction in (
    'Inspect Incident Location',
    'Assess Incident Severity',
    'Secure the Affected Area',
    'Provide Immediate Assistance',
    'Coordinate With Relevant Department',
    'Prepare Required Equipment',
    'Follow Up on Incident',
    'Verify Incident Resolution'
  ));

-- 5. Create index for fast responder and instruction lookups
create index if not exists idx_assignments_field_responder
  on public.incident_assignments(field_responder)
  where field_responder is not null;

create index if not exists idx_assignments_instruction
  on public.incident_assignments(instruction)
  where instruction is not null;
