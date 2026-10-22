-- ==============================================================================
-- Butuan Report — Grant Execute on generate_report_number to Authenticated
-- 20261002000005_grant_generate_report_number.sql
-- ==============================================================================

-- Grant execute on generate_report_number to authenticated users so column defaults and RPC work
grant execute on function public.generate_report_number() to authenticated, service_role;
grant usage on sequence public.incident_report_seq to authenticated, service_role;
