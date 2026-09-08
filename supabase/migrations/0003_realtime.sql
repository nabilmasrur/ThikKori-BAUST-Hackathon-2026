-- ═══════════════════════════════════════════════════════════════════
-- ThikKori — realtime
-- The two-screen demo (customer on one device, provider on another) needs
-- change events on every table the UI renders from.
-- ═══════════════════════════════════════════════════════════════════

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'customers', 'providers', 'service_categories', 'requests', 'request_matches',
    'bookings', 'status_history', 'reviews', 'loyalty', 'challenges',
    'invoices', 'provider_costs', 'admin_announcements', 'reported_issues'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table %I', tbl);
    exception
      when duplicate_object then null;
      when undefined_object then
        raise notice 'publication supabase_realtime not found — create it first';
    end;
  end loop;
end $$;

-- Realtime payloads include the old row for updates, which the client uses
-- to tell "status changed" from "row touched".
alter table bookings       replica identity full;
alter table invoices       replica identity full;
alter table requests       replica identity full;
alter table request_matches replica identity full;
