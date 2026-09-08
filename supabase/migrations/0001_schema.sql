-- ═══════════════════════════════════════════════════════════════════
-- ThikKori — schema
-- Run order: 0001_schema.sql → 0002_rls.sql → 0003_realtime.sql → seed.sql
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- ── Enums ──────────────────────────────────────────────────────────
do $$ begin
  create type urgency        as enum ('normal', 'urgent', 'emergency');
  create type booking_status as enum ('requested', 'accepted', 'on_the_way', 'in_progress', 'completed', 'cancelled');
  create type request_status as enum ('open', 'matched', 'booked', 'cancelled', 'closed');
  create type match_status   as enum ('suggested', 'chosen', 'declined', 'expired');
  create type payment_status as enum ('pending', 'paid');
  create type payment_method as enum ('bkash', 'nagad', 'cash');
  create type tier_name      as enum ('beginner', 'rising', 'pro', 'expert', 'master');
  create type cost_category  as enum ('tools', 'transport', 'materials', 'other');
  create type challenge_type as enum ('daily', 'weekly', 'monthly');
  create type challenge_state as enum ('active', 'completed', 'expired');
  create type issue_status   as enum ('open', 'resolved', 'escalated');
  create type announce_target as enum ('all', 'customers', 'providers');
  create type announce_urgency as enum ('normal', 'urgent');
  create type app_locale     as enum ('en', 'bn');
exception when duplicate_object then null; end $$;

-- ── Reference ──────────────────────────────────────────────────────

create table if not exists provider_tiers (
  tier_name           tier_name primary key,
  min_jobs            integer not null default 0,
  min_earnings        numeric(12,2) not null default 0,
  match_score_bonus   numeric(4,2) not null default 0,
  max_wage_multiplier numeric(4,2) not null default 1
);

create table if not exists service_categories (
  id          text primary key,
  name        text not null,
  name_bn     text not null,
  icon        text not null default 'maintenance',
  base_price  numeric(10,2) not null default 0,
  active      boolean not null default true,
  sort_order  integer not null default 0
);

-- ── Actors ─────────────────────────────────────────────────────────

create table if not exists customers (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  phone              text not null unique,
  area               text not null,
  address            text not null default '',
  trust_score        integer not null default 80 check (trust_score between 0 and 100),
  preferred_language app_locale not null default 'bn',
  suspended          boolean not null default false,
  created_at         timestamptz not null default now()
);

create table if not exists providers (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  business_name       text not null,
  phone               text not null,
  service_categories  text[] not null default '{}',
  rating              numeric(3,2) not null default 0 check (rating between 0 and 5),
  ratings_count       integer not null default 0,
  completed_jobs_count integer not null default 0,
  total_earnings      numeric(12,2) not null default 0,
  total_costs         numeric(12,2) not null default 0,
  tier                tier_name not null default 'beginner' references provider_tiers(tier_name),
  base_area           text not null,
  base_lat            double precision not null,
  base_lng            double precision not null,
  service_radius_km   numeric(5,1) not null default 8,
  hourly_rate         numeric(10,2) not null default 400,
  qr_code_url         text not null default '',
  preferred_language  app_locale not null default 'bn',
  is_online           boolean not null default true,
  suspended           boolean not null default false,
  flagged_for_review  boolean not null default false,
  created_at          timestamptz not null default now()
);

create index if not exists providers_categories_idx on providers using gin (service_categories);

-- ── Requests & matching ────────────────────────────────────────────

create table if not exists requests (
  id                    uuid primary key default gen_random_uuid(),
  customer_id           uuid not null references customers(id) on delete cascade,
  service_category_id   text not null references service_categories(id),
  area                  text not null,
  address               text not null default '',
  lat                   double precision not null,
  lng                   double precision not null,
  preferred_date        date not null,
  preferred_time_window text not null,
  urgency               urgency not null default 'normal',
  problem_description   text not null default '',
  image_url             text,
  status                request_status not null default 'open',
  created_at            timestamptz not null default now()
);

create index if not exists requests_status_idx on requests (status, created_at desc);

create table if not exists request_matches (
  id              uuid primary key default gen_random_uuid(),
  request_id      uuid not null references requests(id) on delete cascade,
  provider_id     uuid not null references providers(id) on delete cascade,
  match_score     numeric(5,4) not null,
  score_breakdown jsonb not null default '{}'::jsonb,
  status          match_status not null default 'suggested',
  created_at      timestamptz not null default now(),
  unique (request_id, provider_id)
);

-- ── Bookings ───────────────────────────────────────────────────────

create table if not exists bookings (
  id             uuid primary key default gen_random_uuid(),
  request_id     uuid not null references requests(id) on delete cascade,
  provider_id    uuid not null references providers(id),
  customer_id    uuid not null references customers(id),
  confirmed_date date not null,
  confirmed_slot text not null,
  agreed_price   numeric(10,2) not null default 0,
  status         booking_status not null default 'requested',
  cancel_reason  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- A provider can hold exactly one live booking per date + slot.
-- Cancelled bookings are excluded so a freed slot can be rebooked.
create unique index if not exists bookings_no_double_booking
  on bookings (provider_id, confirmed_date, confirmed_slot)
  where status <> 'cancelled';

create index if not exists bookings_provider_idx on bookings (provider_id, status);
create index if not exists bookings_customer_idx on bookings (customer_id, created_at desc);

create table if not exists status_history (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  status     booking_status not null,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists status_history_booking_idx on status_history (booking_id, created_at);

-- ── Money ──────────────────────────────────────────────────────────

create table if not exists invoices (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid not null references bookings(id) on delete cascade,
  provider_id    uuid not null references providers(id),
  customer_id    uuid not null references customers(id),
  line_items     jsonb not null default '[]'::jsonb,
  subtotal       numeric(10,2) not null default 0,
  platform_fee   numeric(10,2) not null default 0,
  total          numeric(10,2) not null default 0,
  payment_method payment_method,
  payment_status payment_status not null default 'pending',
  -- The QR code encodes this and nothing else, so it must be unguessable.
  qr_token       uuid not null unique default gen_random_uuid(),
  generated_at   timestamptz not null default now(),
  paid_at        timestamptz,
  unique (booking_id)
);

create index if not exists invoices_provider_idx on invoices (provider_id, payment_status);

create table if not exists provider_costs (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  description text not null,
  amount      numeric(10,2) not null check (amount > 0),
  category    cost_category not null default 'other',
  date        date not null default current_date,
  -- Nullable on purpose: tools and fuel are not tied to one job.
  booking_id  uuid references bookings(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists provider_costs_provider_idx on provider_costs (provider_id, date desc);

-- ── Engagement ─────────────────────────────────────────────────────

create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references bookings(id) on delete cascade unique,
  customer_id uuid not null references customers(id) on delete cascade,
  provider_id uuid not null references providers(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  comment     text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists loyalty (
  customer_id      uuid primary key references customers(id) on delete cascade,
  points           integer not null default 0,
  rated_bookings   integer not null default 0,
  coupons_unlocked text[] not null default '{}'
);

create table if not exists challenges (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  type        challenge_type not null,
  title       text not null,
  title_bn    text not null,
  goal        integer not null check (goal > 0),
  progress    integer not null default 0,
  reward      numeric(10,2) not null default 0,
  status      challenge_state not null default 'active',
  ends_at     timestamptz not null
);

-- ── Back office ────────────────────────────────────────────────────

create table if not exists admin_announcements (
  id               uuid primary key default gen_random_uuid(),
  target_role      announce_target not null default 'all',
  message          text not null,
  message_bn       text not null default '',
  urgency          announce_urgency not null default 'normal',
  sent_at          timestamptz not null default now(),
  sent_by_admin_id text not null default 'admin'
);

create table if not exists reported_issues (
  id                      uuid primary key default gen_random_uuid(),
  booking_id              uuid not null references bookings(id) on delete cascade,
  reported_by_customer_id uuid not null references customers(id) on delete cascade,
  reason                  text not null,
  status                  issue_status not null default 'open',
  admin_note              text,
  created_at              timestamptz not null default now()
);

-- ── Keep booking timestamps honest ─────────────────────────────────

create or replace function touch_booking() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists bookings_touch on bookings;
create trigger bookings_touch before update on bookings
  for each row execute function touch_booking();
