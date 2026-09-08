# ThikKori — ঠিক করি

**Smart home service automation for Dhaka.** BAUST CSE FEST 2026 hackathon build.

> *How can technology reduce the manual effort required to request, assign, schedule and complete everyday services?*

ThikKori answers that question end to end. A customer describes a problem; the
platform ranks technicians with an explainable match score, locks a slot that
cannot be double-booked, streams live status to both sides, generates the
invoice automatically when work starts, and closes the job the moment the
customer scans a QR code and confirms payment. Nobody phones anybody.

---

## Contents

- [Quick start](#quick-start)
- [The three panels](#the-three-panels)
- [Demo script](#demo-script-8-minutes)
- [Match score formula and weights](#match-score-formula-and-weights)
- [QR invoice flow](#qr-invoice-flow)
- [QR token security model](#qr-token-security-model)
- [Backends: local and Supabase](#backends-local-and-supabase)
- [Database setup and seeding](#database-setup-and-seeding)
- [Admin credentials](#admin-credentials)
- [Internationalisation](#internationalisation)
- [Design system](#design-system)
- [Project layout](#project-layout)
- [Testing](#testing)
- [Deploying to Vercel](#deploying-to-vercel)

---

## Quick start

```bash
npm install
cp .env.example .env.local     # optional — the app runs without it
npm run dev                    # http://localhost:5173
```

Nothing else is required. With no Supabase keys in `.env.local` the app boots on
a **local backend**: the full seeded database lives in `localStorage` and every
change is broadcast to other tabs on the same machine over `BroadcastChannel`.
That is enough for the two-screen demo (customer in one tab, provider in
another). Add Supabase keys and the same app runs across real devices.

```bash
npm run build      # type-check + production bundle
npm run smoke      # build, then drive the whole flow in a headless browser
npm run seed:sql   # regenerate supabase/seed.sql from the seed module
```

---

## The three panels

The first screen is a **language choice** — বাংলা or English — stored as
`locale` in `localStorage`. Returning visitors skip straight past it. After
that, a **panel selection** screen offers three doors, each with its own auth
flow and route prefix.

| Panel | Route | What it does |
|---|---|---|
| Customer | `/customer/*` | Category grid, 4-step request wizard, explainable matching, live tracking, ratings, loyalty coupons |
| Provider | `/provider/*` | Incoming jobs, accept/reject, status updates, payment QR, earnings & cost tracker, tier, challenges, leaderboard |
| Admin | `/admin/*` | Overview metrics, booking monitor with force-cancel and reassign, provider and customer management, category management, reported issues, analytics, announcement broadcast |
| Invoice | `/pay/:token` | Public, no login. The page a QR scan opens. |

Signing in stores the session in **`sessionStorage`, not `localStorage`**, so one
laptop can be signed in as a customer in one tab and a provider in another —
which is exactly what the live realtime demo needs.

Each account carries a `preferred_language`, so signing in switches the UI to
that person's language automatically. The toggle in the top bar overrides it at
any time, on every screen.

---

## Demo script (8 minutes)

Two browser windows side by side. Judges should see the two screens move
together without anyone pressing refresh.

1. **Language screen** → English. → **Panels** → Customer → sign in as *Ayesha
   Siddiqua* (her preference flips the UI to Bangla — mention that this is the
   `preferred_language` column doing its job, then toggle back to English).
2. **New request**: Appliance & Gadget Repair → "Split AC is running but not
   cooling, water dripping from the indoor unit" → Dhanmondi → today, 4:00–6:00
   PM → Normal. This is the brief's own worked example.
3. **Matching**: three technicians, each with a score and a *Why this ranking*
   panel. Point at one row — "4.8 rating contributes 28%" — and note the formula
   printed underneath. Book the top one.
4. **Second window** → Provider → sign in as that technician. The job is already
   in *New requests*. Accept → the customer window's timeline advances on its
   own.
5. Start travelling → Start work. The invoice is generated automatically at this
   step; no one types an amount.
6. **Show payment QR**. Scan it with a phone, or open the link. The invoice page
   loads with no login.
7. Pick bKash → **Confirm payment**. The booking completes itself on both
   screens, the provider's earnings and tier update, and the customer is offered
   the rating that unlocks a coupon.
8. **Admin** → Overview and Analytics for the platform view; Bookings monitor
   for force-cancel and reassign.

Backup: `npm run smoke` records the same journey as pass/fail lines if the live
demo has to be defended after a network failure.

---

## Match score formula and weights

```
Match Score = 0.24·Availability
            + 0.22·Distance
            + 0.24·Rating
            + 0.16·Price
            + 0.09·Expertise
            + 0.05·TierBonus
```

Weights sum to 1.0, so the score reads directly as a percentage. Implemented in
[`src/lib/matching.ts`](src/lib/matching.ts).

| Factor | Weight | Sub-score, normalised to 0–1 |
|---|---|---|
| Availability | 0.24 | `1.0` for the exact requested window; otherwise decays 0.18 per window of drift, floored at 0.35; `0` when the provider has no free slot that day. Being online adds 0.05. |
| Distance | 0.22 | `1 − (haversine km ÷ provider's service radius)`. A provider outside their own radius is filtered out before scoring. |
| Rating | 0.24 | `(rating − 3) ÷ 2`, clamped — the usable 3.0–5.0 band. An unrated provider sits at 0.5 rather than 0. |
| Price | 0.16 | `1 − (quote − cheapest) ÷ (dearest − cheapest)` across the eligible set. Cheapest scores 1, dearest 0. |
| Expertise | 0.09 | `0.45 · (1 ÷ categories served) + 0.55 · (jobs done ÷ 120, capped)`. Specialists beat generalists. |
| Tier bonus | 0.05 | 0.00 Beginner · 0.25 Rising · 0.50 Pro · 0.75 Expert · 1.00 Master. |

The quote itself is `category base price × tier wage multiplier × urgency
premium`, rounded to the nearest ৳50. Urgency premium is 1.0 normal, 1.15
urgent, 1.35 emergency.

**Nothing on screen is decorative.** Every match is stored in
`request_matches.score_breakdown` as JSON — the raw sub-score, the weight, the
absolute contribution and the share of the final score for all six factors. The
*Why this ranking* panel renders those stored numbers; it never recomputes for
display. If a bar says a factor contributed 28%, that is the number the sort
used.

Providers who have no free slot on the requested date are dropped, which is what
produces the *No technician is available* empty state rather than a blank list.

---

## QR invoice flow

```
provider marks job In Progress
        │
        ├─► invoice row created automatically
        │     subtotal      = agreed price
        │     platform_fee  = 5% (VITE_PLATFORM_FEE_RATE)
        │     total         = subtotal + fee
        │     line_items    = [{ description, quantity, unit_price }]
        │     qr_token      = fresh UUID
        │
        ├─► provider taps "Show payment QR"
        │     QR encodes  https://<origin>/pay/<qr_token>
        │
        ├─► customer scans with their phone camera → /pay/:token
        │     receipt-style page, no login, bKash / Nagad / Cash
        │
        └─► "Confirm payment"
              invoices.payment_status → paid, paid_at, payment_method
              bookings.status         → completed
              status_history          += completed row
              providers               += job count, earnings, recomputed tier
              challenges              += progress
              customer                → prompted to rate → loyalty points
```

Both sides update live: the provider's dashboard moves the job to Completed
without a refresh, and the customer's timeline fills in.

Edge cases are real screens, not blank pages: an unknown token shows *This
invoice link is invalid*; a token that was already paid shows the receipt
read-only with *Already paid on …*.

---

## QR token security model

The person scanning the code may not have an account, so the token has to be the
entire credential. That is safe under three properties:

1. **The token is an unguessable v4 UUID** (`gen_random_uuid()`), unique per
   invoice, and it is the only thing the QR encodes. It is not derived from the
   booking id, the customer, or anything enumerable.
2. **It grants access to exactly one invoice.** In hardened mode the anonymous
   client cannot select from `invoices` at all. Two `SECURITY DEFINER` functions
   are the only doors, and each takes the token as its argument:
   `invoice_by_token(token)` returns one row, `pay_invoice(token, method)`
   performs the whole completion transaction. There is no query shape that
   returns a second invoice.
3. **Paying is idempotent and one-way.** `pay_invoice` returns early if the
   invoice is already paid, so a replayed link cannot double-charge, and there
   is no function that moves an invoice back to pending.

What the token deliberately does *not* do: it carries no personal data, it
cannot read any other table, and it cannot be used to authenticate as the
customer. If a code is photographed by a stranger, the worst they can do is mark
that one job as paid — visible immediately to both the provider and the admin
booking monitor.

For the demo the local backend has no server to enforce this, so the same
model is expressed in SQL and switched on with one statement (below).

---

## Backends: local and Supabase

Both implement the same interface — [`src/data/adapter.ts`](src/data/adapter.ts) —
so no screen and no operation in the app knows which one it is talking to.

| | Local (`LocalAdapter`) | Supabase (`SupabaseAdapter`) |
|---|---|---|
| Storage | `localStorage`, seeded on first load | Postgres |
| Realtime | `BroadcastChannel` + `storage` events (same machine) | Postgres change events (any device) |
| Setup | none | ~15 minutes |
| Used when | Supabase env vars are empty | `VITE_SUPABASE_URL` **and** `VITE_SUPABASE_ANON_KEY` are set |

Selection happens once, in [`src/data/index.ts`](src/data/index.ts). The panel
selection screen shows which backend is live.

Business logic lives in [`src/data/operations.ts`](src/data/operations.ts) —
request creation and matching, booking confirmation with the double-booking
guard, the status machine, invoice generation, payment, reviews and loyalty,
cost logging, and the admin actions. It is written against the adapter
interface, so it runs unchanged on either backend.

---

## Database setup and seeding

1. Create a Supabase project.
2. In the SQL editor, run in order:
   - `supabase/migrations/0001_schema.sql` — tables, enums, constraints, indexes
   - `supabase/migrations/0002_rls.sql` — row level security and the invoice RPCs
   - `supabase/migrations/0003_realtime.sql` — realtime publication
   - `supabase/seed.sql` — mock data
3. Put the project URL and anon key in `.env.local` and restart the dev server.

**Regenerating the seed.** `supabase/seed.sql` is generated from
[`src/data/seed.ts`](src/data/seed.ts) — the same module the local backend
loads — so the two backends can never drift:

```bash
npm run seed:sql
```

The seed covers every table: 8 categories, 14 Dhaka providers, 10 customers,
about six months of completed-and-paid jobs (so the finance and analytics charts
have real history), provider costs, reviews, loyalty rows, challenges, reported
issues and announcements. It also plants the live demo state: the brief's AC
repair job in Dhanmondi sitting at *In progress* with a pending invoice behind a
scannable QR, an urgent plumbing request with three suggested matches, and two
jobs waiting in providers' queues so no dashboard is ever empty.

**Constraints worth knowing.** A partial unique index on
`(provider_id, confirmed_date, confirmed_slot) where status <> 'cancelled'`
makes double-booking impossible at the database level, not just in the UI, and
cancelling frees the slot again. `invoices.qr_token` is unique.
`provider_costs.booking_id` is nullable on purpose — a wrench and a tank of fuel
are not tied to one job.

**RLS posture.** `0002_rls.sql` ships with `platform_settings.demo_mode = true`,
which lets the anon key drive the whole product — necessary because the MVP has
no per-user auth. Harden it with:

```sql
update platform_settings set demo_mode = false;
```

After that, anonymous clients keep only the public directory (categories, tiers,
provider profiles), invoices are reachable only through the two token-scoped
functions, and `admin_announcements` and `reported_issues` require an
authenticated user whose JWT carries `role = 'admin'`.

---

## Admin credentials

There is no public admin registration. Credentials come from the environment:

```env
VITE_ADMIN_EMAIL=admin@thikkori.com.bd
VITE_ADMIN_PASSWORD=thikkori-admin-2026
```

Those defaults are in `.env.example` and are what the demo build uses. Change
both before any deployment that is not a hackathon demo. Because Vite inlines
`VITE_*` variables into the client bundle, this is a demo-grade gate, not a
production auth system — the durable protection is the RLS policy on the
admin-only tables, which is why `demo_mode` exists as a separate switch.

---

## Internationalisation

- `react-i18next`, initialised in [`src/i18n.ts`](src/i18n.ts).
- Two files: `public/locales/en/translation.json` and
  `public/locales/bn/translation.json`, ~400 keys each, mirrored exactly.
- **No user-facing string is hardcoded in a component.** Category and challenge
  names come from the database, which stores both `name` and `name_bn`.
- Bangla uses proper Bengali script throughout: সেবার অনুরোধ, অবস্থা দেখুন,
  সেবাদাতা, চালান, পরিশোধ, ড্যাশবোর্ড, আয়.
- **Bengali numerals** (০১২৩৪৫৬৭৮৯) are used for every amount, date, time and
  count in the Bangla locale — see [`src/lib/format.ts`](src/lib/format.ts).
  Money is always comma-grouped with the taka sign: ৳1,500 / ৳১,৫০০.
- The payment confirmation is deliberately bilingual at the same time, because
  the person scanning the code may not share the technician's language.

---

## Design system

| Role | Hex |
|---|---|
| Background | `#F2F1EC` warm muted stone |
| Primary | `#1D4B4A` deep ink-teal |
| Accent / CTA | `#D98C2B` warm amber |
| Text | `#1C1A17` warm near-black |
| Success | `#3F7A54` muted sage |
| Alert / urgent | `#B8452F` brick |

- Warm-stone ground carries a 2.5% grain texture applied once at the root, not
  a gradient wash.
- The customer hero leads with a drawn illustration of a technician at work.
- Headings in Bricolage Grotesque, body in Inter, amounts and identifiers in IBM
  Plex Mono with tabular figures; Hind Siliguri carries Bengali. No all-caps
  labels.
- Status colour is information, not decoration, and it is consistent everywhere
  a status appears: neutral requested, teal accepted, amber on the way and in
  progress, sage completed, brick cancelled.
- The invoice page has its own receipt aesthetic — `#FAF9F6`, ruled lines,
  monospace amounts — so it reads as a document rather than a form.
- Motion is one entrance animation and a checkmark on payment confirmation.
  Nothing fades in on scroll. `prefers-reduced-motion` is respected.
- Accessibility: semantic HTML, visible focus rings, `aria-label` on icon-only
  controls, `aria-pressed` on toggles, `role="progressbar"` with values, live
  regions for notifications. The provider dashboard is deliberately
  icon-forward with large type and large touch targets.

Error and empty states are designed screens, not afterthoughts: 404, no
providers available (with a next step), connection error (with the failing
detail and a retry), empty provider dashboard, empty bookings, no costs logged,
no reported issues, invalid QR token, and already-paid invoice. None of them
says "Oops".

---

## Project layout

```
src/
  types.ts                 domain model, mirrors the SQL schema 1:1
  i18n.ts                  react-i18next setup
  lib/
    constants.ts           weights, tiers, palette constants, env access
    matching.ts            match score engine, slots, quotes, tiers
    format.ts              taka, Bengali numerals, dates, slots
    labels.ts              locale-aware names and short references
    useFmt.ts              one hook for strings + numbers
  data/
    adapter.ts             the interface both backends implement
    localAdapter.ts        localStorage + BroadcastChannel
    supabaseAdapter.ts     Postgres + realtime
    operations.ts          all business logic, backend-agnostic
    seed.ts                deterministic seed, shared with seed.sql
  state/                   session, data snapshot, toasts
  components/              UI primitives, icons, logo, timeline, hero art
  features/
    language/  panels/  auth/
    customer/  provider/  admin/  invoice/  errors/
supabase/
  migrations/0001_schema.sql  0002_rls.sql  0003_realtime.sql
  seed.sql                 generated
scripts/
  gen-seed-sql.mjs         seed.ts → seed.sql
  smoke.mjs                headless end-to-end walkthrough
```

Each panel is a lazily-loaded route tree, so a customer never downloads the
admin bundle.

---

## Testing

```bash
npm run smoke
```

Builds, serves `dist/`, and drives a real browser through the entire product:
language selection, panel routing, the request wizard, computed match scores and
their breakdowns, booking, provider status transitions, QR generation, live
cross-tab sync, the public invoice page, payment confirmation, automatic booking
completion, both invoice error states, the finances chart, tier and challenges,
all eight admin modules, the Bangla locale including Bengali numerals, and the
404 page. It fails the build on any uncaught page error.

Requires Playwright's Chromium.

---

## Deploying to Vercel

1. Push to GitHub.
2. Import the repo in Vercel. Framework preset: **Vite**. Build `npm run build`,
   output `dist`.
3. Add the environment variables from `.env.example`. Set `VITE_PUBLIC_ORIGIN`
   to the deployed URL so QR codes encode the public host rather than
   `localhost` — this is the one variable that will spoil a live demo if it is
   wrong.
4. Add a rewrite so deep links like `/pay/<token>` resolve client-side:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Save that as `vercel.json` at the repo root — it is already included.

---

## Future scope

Presented as product thinking rather than built: urgent-job incentive
multipliers for providers who accept quickly, a streak counter for consecutive
days without a cancellation, customer trust score gating priority booking,
referral bonuses, and route optimisation across a provider's day rather than
per-job distance.

---

Built for BAUST CSE FEST 2026.
