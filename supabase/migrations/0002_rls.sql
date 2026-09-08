-- ═══════════════════════════════════════════════════════════════════
-- ThikKori — row level security
--
-- Two postures, one switch:
--   platform_settings.demo_mode = true   → the anon key can drive the whole
--        product. This is what the hackathon demo and the Vercel preview run
--        on, because there is no user auth in the MVP.
--   platform_settings.demo_mode = false  → hardened. Anonymous clients keep
--        only the public directory and the token-scoped invoice RPCs; the
--        admin tables need an authenticated user carrying role = 'admin'.
--
-- Flip it with:  update platform_settings set demo_mode = false;
-- ═══════════════════════════════════════════════════════════════════

create table if not exists platform_settings (
  id        boolean primary key default true check (id),
  demo_mode boolean not null default true
);
insert into platform_settings (id, demo_mode) values (true, true) on conflict do nothing;

alter table platform_settings enable row level security;
drop policy if exists settings_read on platform_settings;
create policy settings_read on platform_settings for select using (true);

create or replace function public.demo_mode() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select demo_mode from platform_settings limit 1), false)
$$;

create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role' = 'admin',
    false
  )
$$;

-- ── Enable RLS everywhere ──────────────────────────────────────────
alter table customers           enable row level security;
alter table providers           enable row level security;
alter table service_categories  enable row level security;
alter table provider_tiers      enable row level security;
alter table requests            enable row level security;
alter table request_matches     enable row level security;
alter table bookings            enable row level security;
alter table status_history      enable row level security;
alter table invoices            enable row level security;
alter table provider_costs      enable row level security;
alter table reviews             enable row level security;
alter table loyalty             enable row level security;
alter table challenges          enable row level security;
alter table admin_announcements enable row level security;
alter table reported_issues     enable row level security;

-- ── Public directory: readable by anyone, always ───────────────────
drop policy if exists categories_read on service_categories;
create policy categories_read on service_categories for select using (true);

drop policy if exists tiers_read on provider_tiers;
create policy tiers_read on provider_tiers for select using (true);

drop policy if exists providers_read on providers;
create policy providers_read on providers for select using (true);

-- ── Operational tables ─────────────────────────────────────────────
-- In demo mode the anon key may read and write; hardened mode requires admin.
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'customers', 'requests', 'request_matches', 'bookings', 'status_history',
    'provider_costs', 'reviews', 'loyalty', 'challenges'
  ] loop
    execute format('drop policy if exists %I_rw on %I', tbl, tbl);
    execute format(
      'create policy %I_rw on %I for all using (public.demo_mode() or public.is_admin())
       with check (public.demo_mode() or public.is_admin())',
      tbl, tbl
    );
  end loop;
end $$;

-- Providers are writable (online flag, tier, earnings) under the same rule.
drop policy if exists providers_write on providers;
create policy providers_write on providers for update
  using (public.demo_mode() or public.is_admin())
  with check (public.demo_mode() or public.is_admin());

drop policy if exists categories_write on service_categories;
create policy categories_write on service_categories for all
  using (public.demo_mode() or public.is_admin())
  with check (public.demo_mode() or public.is_admin());

-- ── Admin-only tables ──────────────────────────────────────────────
-- Outside demo mode these are unreachable without an admin JWT.
drop policy if exists announcements_admin on admin_announcements;
create policy announcements_admin on admin_announcements for all
  using (public.demo_mode() or public.is_admin())
  with check (public.demo_mode() or public.is_admin());

drop policy if exists issues_admin on reported_issues;
create policy issues_admin on reported_issues for all
  using (public.demo_mode() or public.is_admin())
  with check (public.demo_mode() or public.is_admin());

-- ── Invoices: the QR token is the credential ───────────────────────
-- The customer who scans a code has no account. Outside demo mode the two
-- SECURITY DEFINER functions below are the only way in, and each one takes
-- the token as its argument — so knowing a token grants access to exactly
-- that one invoice and nothing else.
drop policy if exists invoices_rw on invoices;
create policy invoices_rw on invoices for all
  using (public.demo_mode() or public.is_admin())
  with check (public.demo_mode() or public.is_admin());

create or replace function public.invoice_by_token(token uuid)
returns table (
  id uuid, booking_id uuid, line_items jsonb, subtotal numeric,
  platform_fee numeric, total numeric, payment_method payment_method,
  payment_status payment_status, generated_at timestamptz, paid_at timestamptz,
  provider_name text, provider_business text, customer_name text, category_name text, category_name_bn text
)
language sql stable security definer set search_path = public as $$
  select i.id, i.booking_id, i.line_items, i.subtotal, i.platform_fee, i.total,
         i.payment_method, i.payment_status, i.generated_at, i.paid_at,
         p.name, p.business_name, c.name, sc.name, sc.name_bn
  from invoices i
  join providers p on p.id = i.provider_id
  join customers c on c.id = i.customer_id
  join bookings  b on b.id = i.booking_id
  join requests  r on r.id = b.request_id
  join service_categories sc on sc.id = r.service_category_id
  where i.qr_token = token
$$;

-- Marking an invoice paid is one atomic step: invoice, booking, history,
-- provider totals and tier all move together or not at all.
create or replace function public.pay_invoice(token uuid, method payment_method)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  inv invoices;
  bk  bookings;
  new_jobs int;
  new_earnings numeric;
  new_tier tier_name;
begin
  select * into inv from invoices where qr_token = token for update;
  if inv.id is null then return false; end if;
  if inv.payment_status = 'paid' then return true; end if;

  update invoices
     set payment_status = 'paid', payment_method = method, paid_at = now()
   where id = inv.id;

  select * into bk from bookings where id = inv.booking_id for update;
  if bk.id is not null and bk.status <> 'completed' then
    update bookings set status = 'completed' where id = bk.id;
    insert into status_history (booking_id, status, note)
      values (bk.id, 'completed', 'paid_via:' || method::text);
    update requests set status = 'closed' where id = bk.request_id;
  end if;

  select completed_jobs_count + 1, total_earnings + inv.subtotal
    into new_jobs, new_earnings
    from providers where id = inv.provider_id;

  select tier_name into new_tier
    from provider_tiers
   where min_jobs <= new_jobs and min_earnings <= new_earnings
   order by min_jobs desc limit 1;

  update providers
     set completed_jobs_count = new_jobs,
         total_earnings = new_earnings,
         tier = coalesce(new_tier, tier)
   where id = inv.provider_id;

  return true;
end $$;

grant execute on function public.invoice_by_token(uuid) to anon, authenticated;
grant execute on function public.pay_invoice(uuid, payment_method) to anon, authenticated;
