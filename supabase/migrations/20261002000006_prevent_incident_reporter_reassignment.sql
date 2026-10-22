-- ==============================================================================
-- Butuan Report — Enforce Immutability of Incident Reporter ID
-- 20261002000006_prevent_incident_reporter_reassignment.sql
-- ==============================================================================

-- Create a trigger function that prohibits modifying reporter_id on existing incidents
create or replace function public.prevent_incident_reporter_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.reporter_id is distinct from OLD.reporter_id then
    raise exception 'Modifying reporter_id on an incident report is strictly prohibited.';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_prevent_incident_reporter_change on public.incidents;
create trigger trg_prevent_incident_reporter_change
before update on public.incidents
for each row
execute function public.prevent_incident_reporter_change();
