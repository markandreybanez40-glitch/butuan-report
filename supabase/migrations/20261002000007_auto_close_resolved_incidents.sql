-- ==============================================================================
-- Butuan Report — Auto-Close Resolved Incidents Database Trigger
-- 20261002000007_auto_close_resolved_incidents.sql
-- ==============================================================================

-- Create or replace trigger function to guarantee database-level auto-closure
create or replace function public.auto_close_resolved_incident()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- When an incident is set to 'resolved', automatically set to 'closed'
  -- and guarantee both resolved_at and closed_at timestamps are recorded.
  if NEW.status = 'resolved' then
    NEW.status := 'closed';
    if NEW.resolved_at is null then
      NEW.resolved_at := now();
    end if;
    if NEW.closed_at is null then
      NEW.closed_at := now();
    end if;
  end if;

  -- If status transitions to 'closed' directly and closed_at is null, set closed_at
  if NEW.status = 'closed' and NEW.closed_at is null then
    NEW.closed_at := now();
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_auto_close_resolved_incident on public.incidents;
create trigger trg_auto_close_resolved_incident
before insert or update on public.incidents
for each row
execute function public.auto_close_resolved_incident();
