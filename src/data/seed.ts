// ── Deterministic seed data ──────────────────────────────────────────
// One source of truth for both backends: the local adapter loads this
// directly, and `npm run seed:sql` renders the exact same rows into
// supabase/seed.sql. Imports stay relative so plain Node can run it.

import { DHAKA_AREAS, PLATFORM_FEE_RATE, TIME_WINDOWS } from '../lib/constants';
import { tierFor } from '../lib/matching';
import type {
  AdminAnnouncement,
  Booking,
  Challenge,
  Customer,
  Database,
  Invoice,
  Loyalty,
  Provider,
  ProviderCost,
  ReportedIssue,
  RequestMatch,
  Review,
  ServiceCategory,
  ServiceRequest,
  StatusHistoryEntry,
  TierName,
} from '../types';
import { TIERS } from '../lib/constants';

/** mulberry32 — small, fast, and stable across runs. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const uuid = (n: number, tag: string) =>
  `${tag.padEnd(8, '0').slice(0, 8)}-0000-4000-8000-${n.toString().padStart(12, '0')}`;

const iso = (d: Date) => d.toISOString();
const day = (d: Date) => d.toISOString().slice(0, 10);
const shift = (base: Date, days: number, hours = 0) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(d.getHours() + hours);
  return d;
};

export const CATEGORIES: ServiceCategory[] = [
  { id: 'appliance', name: 'Appliance & Gadget Repair', name_bn: 'যন্ত্রপাতি ও গ্যাজেট মেরামত', icon: 'appliance', base_price: 1000, active: true, sort_order: 1 },
  { id: 'plumbing', name: 'Plumbing', name_bn: 'পাইপ ও স্যানিটারি', icon: 'plumbing', base_price: 800, active: true, sort_order: 2 },
  { id: 'electrical', name: 'Electrical', name_bn: 'ইলেকট্রিক কাজ', icon: 'electrical', base_price: 900, active: true, sort_order: 3 },
  { id: 'cleaning', name: 'Cleaning & Pest Control', name_bn: 'পরিষ্কার ও কীটনাশক', icon: 'cleaning', base_price: 1500, active: true, sort_order: 4 },
  { id: 'maintenance', name: 'Home Maintenance', name_bn: 'ঘরের রক্ষণাবেক্ষণ', icon: 'maintenance', base_price: 1200, active: true, sort_order: 5 },
  { id: 'moving', name: 'Moving & Shifting', name_bn: 'বাসা বদল ও মালামাল স্থানান্তর', icon: 'moving', base_price: 3500, active: true, sort_order: 6 },
  { id: 'carcare', name: 'Car Care & Repair', name_bn: 'গাড়ির সেবা ও মেরামত', icon: 'carcare', base_price: 2000, active: true, sort_order: 7 },
  { id: 'personal', name: 'Personal Care', name_bn: 'ব্যক্তিগত পরিচর্যা', icon: 'personal', base_price: 700, active: true, sort_order: 8 },
];

interface ProviderSeed {
  name: string;
  business: string;
  cats: string[];
  area: string;
  rating: number;
  ratings: number;
  jobs: number;
  radius: number;
  hourly: number;
  lang: 'en' | 'bn';
  online: boolean;
}

const PROVIDER_SEEDS: ProviderSeed[] = [
  { name: 'Rahim Uddin', business: 'Rahim Electronics', cats: ['appliance', 'electrical'], area: 'Dhanmondi', rating: 4.8, ratings: 96, jobs: 134, radius: 8, hourly: 550, lang: 'bn', online: true },
  { name: 'Shafiqul Islam', business: 'Shafiq Cooling Care', cats: ['appliance'], area: 'Mohammadpur', rating: 4.6, ratings: 61, jobs: 88, radius: 7, hourly: 500, lang: 'bn', online: true },
  { name: 'Jahangir Alam', business: 'Alam Sanitary Works', cats: ['plumbing', 'maintenance'], area: 'Mirpur', rating: 4.5, ratings: 74, jobs: 102, radius: 9, hourly: 420, lang: 'bn', online: true },
  { name: 'Kamrul Hasan', business: 'Hasan Electric House', cats: ['electrical'], area: 'Gulshan', rating: 4.9, ratings: 143, jobs: 231, radius: 10, hourly: 700, lang: 'en', online: true },
  { name: 'Nasir Ahmed', business: 'Nasir Pipe & Fittings', cats: ['plumbing'], area: 'Uttara', rating: 4.3, ratings: 38, jobs: 51, radius: 8, hourly: 400, lang: 'bn', online: false },
  { name: 'Sabbir Rahman', business: 'CleanDhaka Services', cats: ['cleaning'], area: 'Banani', rating: 4.7, ratings: 88, jobs: 119, radius: 12, hourly: 600, lang: 'en', online: true },
  { name: 'Mizanur Rahman', business: 'Mizan Pest Solutions', cats: ['cleaning', 'maintenance'], area: 'Bashundhara', rating: 4.4, ratings: 45, jobs: 63, radius: 10, hourly: 520, lang: 'bn', online: true },
  { name: 'Tanvir Hossain', business: 'Hossain Handy Home', cats: ['maintenance', 'electrical', 'plumbing'], area: 'Mirpur', rating: 4.2, ratings: 29, jobs: 41, radius: 7, hourly: 380, lang: 'bn', online: true },
  { name: 'Anwar Sheikh', business: 'Sheikh Movers & Packers', cats: ['moving'], area: 'Mohammadpur', rating: 4.6, ratings: 52, jobs: 71, radius: 20, hourly: 900, lang: 'bn', online: true },
  { name: 'Faruk Mia', business: 'Faruk Auto Care', cats: ['carcare'], area: 'Uttara', rating: 4.5, ratings: 67, jobs: 94, radius: 15, hourly: 750, lang: 'bn', online: false },
  { name: 'Rafiul Karim', business: 'Karim Motor Garage', cats: ['carcare', 'maintenance'], area: 'Bashundhara', rating: 4.1, ratings: 22, jobs: 33, radius: 14, hourly: 650, lang: 'bn', online: true },
  { name: 'Selina Akter', business: 'Selina Home Salon', cats: ['personal'], area: 'Dhanmondi', rating: 4.9, ratings: 118, jobs: 186, radius: 6, hourly: 480, lang: 'bn', online: true },
  { name: 'Ruma Begum', business: 'Ruma Beauty At Home', cats: ['personal', 'cleaning'], area: 'Gulshan', rating: 4.4, ratings: 40, jobs: 57, radius: 8, hourly: 450, lang: 'bn', online: true },
  { name: 'Imran Khan', business: 'Imran Cool Tech', cats: ['appliance', 'electrical'], area: 'Banani', rating: 4.0, ratings: 12, jobs: 17, radius: 9, hourly: 430, lang: 'en', online: true },
];

interface CustomerSeed {
  name: string;
  phone: string;
  area: string;
  address: string;
  trust: number;
  lang: 'en' | 'bn';
}

const CUSTOMER_SEEDS: CustomerSeed[] = [
  { name: 'Ayesha Siddiqua', phone: '01711000101', area: 'Dhanmondi', address: 'House 42, Road 9/A, Dhanmondi', trust: 92, lang: 'bn' },
  { name: 'Tanjim Chowdhury', phone: '01711000102', area: 'Gulshan', address: 'Apt 5B, Road 71, Gulshan 2', trust: 88, lang: 'en' },
  { name: 'Mahfuz Rahman', phone: '01711000103', area: 'Mirpur', address: 'Block C, Section 11, Mirpur', trust: 76, lang: 'bn' },
  { name: 'Nusrat Jahan', phone: '01711000104', area: 'Uttara', address: 'House 12, Sector 7, Uttara', trust: 95, lang: 'bn' },
  { name: 'Sadia Islam', phone: '01711000105', area: 'Banani', address: 'Road 11, Banani', trust: 81, lang: 'en' },
  { name: 'Rezaul Karim', phone: '01711000106', area: 'Mohammadpur', address: 'Tajmahal Road, Mohammadpur', trust: 69, lang: 'bn' },
  { name: 'Farhana Haque', phone: '01711000107', area: 'Bashundhara', address: 'Block G, Bashundhara R/A', trust: 90, lang: 'bn' },
  { name: 'Arif Mahmud', phone: '01711000108', area: 'Dhanmondi', address: 'Road 27, Dhanmondi', trust: 84, lang: 'en' },
  { name: 'Shirin Sultana', phone: '01711000109', area: 'Mirpur', address: 'Kazipara, Mirpur', trust: 72, lang: 'bn' },
  { name: 'Habibur Rahman', phone: '01711000110', area: 'Gulshan', address: 'Road 45, Gulshan 2', trust: 87, lang: 'bn' },
];

const PROBLEMS: Record<string, string[]> = {
  appliance: ['AC is not cooling, water dripping from indoor unit', 'Refrigerator making loud noise at night', 'Washing machine drum not spinning', 'Microwave stopped heating'],
  plumbing: ['Kitchen sink drains very slowly', 'Bathroom tap leaking constantly', 'Toilet flush tank not filling', 'Water pipe burst under the basin'],
  electrical: ['Two ceiling fans stopped working after load shedding', 'Main switchboard sparks when switched on', 'Bedroom lights flicker', 'Need new wiring for a second AC point'],
  cleaning: ['Full flat deep clean before Eid', 'Cockroach problem in the kitchen', 'Post-renovation dust cleaning', 'Bed bug treatment in two bedrooms'],
  maintenance: ['Bathroom door frame damaged by damp', 'Wall paint peeling in the living room', 'Grill window needs repair', 'False ceiling panel came loose'],
  moving: ['Two-bedroom flat shifting to Uttara', 'Office desk and cabinets shifting', 'Single room shifting within Mirpur', 'Furniture moving to a third floor, no lift'],
  carcare: ['Car AC not cooling in traffic', 'Engine oil change and general servicing', 'Brake pads making noise', 'Battery drains overnight'],
  personal: ['Bridal makeup at home', 'Haircut and beard trim at home', 'Facial and manicure package', 'Hair colouring at home'],
};

const COMMENTS = [
  'Came on time and fixed it in one visit.',
  'Very professional, explained the problem clearly.',
  'Good work, price was fair.',
  'Solved the issue but arrived 20 minutes late.',
  'Excellent service, will book again.',
  'Neat work and cleaned up afterwards.',
];

const COST_ITEMS: { desc: string; cat: 'tools' | 'transport' | 'materials' | 'other'; min: number; max: number }[] = [
  { desc: 'CNG fare to job site', cat: 'transport', min: 120, max: 320 },
  { desc: 'Capacitor and copper wire', cat: 'materials', min: 250, max: 900 },
  { desc: 'New pipe wrench', cat: 'tools', min: 450, max: 1600 },
  { desc: 'PVC pipes and sealant', cat: 'materials', min: 200, max: 700 },
  { desc: 'Mobile recharge for job calls', cat: 'other', min: 50, max: 200 },
  { desc: 'Bike fuel', cat: 'transport', min: 150, max: 400 },
  { desc: 'Multimeter replacement', cat: 'tools', min: 900, max: 2200 },
  { desc: 'Cleaning chemicals', cat: 'materials', min: 300, max: 1100 },
];

function areaOf(name: string) {
  return DHAKA_AREAS.find((a) => a.name === name) ?? DHAKA_AREAS[0];
}

function jitter(r: () => number, base: number, spread: number) {
  return base + (r() - 0.5) * spread;
}

/**
 * Build the full relational snapshot. `now` is injectable so the SQL
 * generator and the runtime store can agree on a reference date.
 */
export function buildSeed(now: Date = new Date()): Database {
  const r = rng(20260208);

  const customers: Customer[] = CUSTOMER_SEEDS.map((c, i) => {
    const area = areaOf(c.area);
    return {
      id: uuid(i + 1, 'cust'),
      name: c.name,
      email: `customer${i + 1}@thikkori.com`,
      password: 'demo123',
      phone: c.phone,
      area: area.name,
      address: c.address,
      trust_score: c.trust,
      preferred_language: c.lang,
      suspended: false,
      created_at: iso(shift(now, -200 + i * 4)),
    };
  });

  const providers: Provider[] = PROVIDER_SEEDS.map((p, i) => {
    const area = areaOf(p.area);
    // Earnings are implied by history; tier is derived, never hand-set.
    const earnings = Math.round(p.jobs * (p.hourly * 1.9)) ;
    const tier = tierFor(p.jobs, earnings).tier_name as TierName;
    return {
      id: uuid(i + 1, 'prov'),
      name: p.name,
      email: `provider${i + 1}@thikkori.com`,
      password: 'demo123',
      business_name: p.business,
      phone: `0181${(1000000 + i * 137).toString().slice(0, 7)}`,
      service_categories: p.cats,
      rating: p.rating,
      ratings_count: p.ratings,
      completed_jobs_count: p.jobs,
      total_earnings: earnings,
      total_costs: Math.round(earnings * jitter(r, 0.17, 0.08)),
      tier,
      base_area: area.name,
      base_lat: Number(jitter(r, area.lat, 0.012).toFixed(5)),
      base_lng: Number(jitter(r, area.lng, 0.012).toFixed(5)),
      service_radius_km: p.radius,
      hourly_rate: p.hourly,
      qr_code_url: '',
      preferred_language: p.lang,
      is_online: p.online,
      suspended: false,
      flagged_for_review: false,
      created_at: iso(shift(now, -320 + i * 7)),
    };
  });

  const requests: ServiceRequest[] = [];
  const request_matches: RequestMatch[] = [];
  const bookings: Booking[] = [];
  const status_history: StatusHistoryEntry[] = [];
  const reviews: Review[] = [];
  const invoices: Invoice[] = [];
  const provider_costs: ProviderCost[] = [];

  let n = 0;
  const nextId = () => ++n;

  const pushHistory = (bookingId: string, status: Booking['status'], at: Date, note?: string) => {
    status_history.push({
      id: uuid(nextId(), 'hist'),
      booking_id: bookingId,
      status,
      note: note ?? null,
      created_at: iso(at),
    });
  };

  // Mirrors the DB's partial unique index: one live booking per provider,
  // date and slot. Without this the generated seed.sql would trip the
  // constraint and orphan the invoice rows that follow it.
  const takenSlots = new Set<string>();

  /** One completed job: request → match → booking → history → invoice → review. */
  function completedJob(daysAgo: number, seq: number) {
    const cust = customers[Math.floor(r() * customers.length)];
    const cat = CATEGORIES[Math.floor(r() * CATEGORIES.length)];
    const pool = providers.filter((p) => p.service_categories.includes(cat.id));
    const area = areaOf(cust.area);
    const start = shift(now, -daysAgo, -6);

    let prov = pool[Math.floor(r() * pool.length)];
    let slot = TIME_WINDOWS[Math.floor(r() * TIME_WINDOWS.length)];
    let key = `${prov.id}|${day(start)}|${slot}`;
    for (let attempt = 0; takenSlots.has(key) && attempt < 12; attempt += 1) {
      prov = pool[Math.floor(r() * pool.length)];
      slot = TIME_WINDOWS[Math.floor(r() * TIME_WINDOWS.length)];
      key = `${prov.id}|${day(start)}|${slot}`;
    }
    if (takenSlots.has(key)) return seq;
    takenSlots.add(key);

    const reqId = uuid(nextId(), 'req');
    const bookId = uuid(nextId(), 'book');
    const problems = PROBLEMS[cat.id];

    requests.push({
      id: reqId,
      customer_id: cust.id,
      service_category_id: cat.id,
      area: area.name,
      address: cust.address,
      lat: Number(jitter(r, area.lat, 0.01).toFixed(5)),
      lng: Number(jitter(r, area.lng, 0.01).toFixed(5)),
      preferred_date: day(start),
      preferred_time_window: slot,
      urgency: r() > 0.82 ? 'urgent' : 'normal',
      problem_description: problems[Math.floor(r() * problems.length)],
      image_url: null,
      status: 'closed',
      created_at: iso(shift(start, 0, -3)),
    });

    const price = Math.round((cat.base_price * jitter(r, 1.05, 0.35)) / 50) * 50;
    bookings.push({
      id: bookId,
      request_id: reqId,
      provider_id: prov.id,
      customer_id: cust.id,
      confirmed_date: day(start),
      confirmed_slot: slot,
      agreed_price: price,
      status: 'completed',
      cancel_reason: null,
      created_at: iso(shift(start, 0, -3)),
      updated_at: iso(shift(start, 0, 2)),
    });

    (['requested', 'accepted', 'on_the_way', 'in_progress', 'completed'] as const).forEach((s, i) =>
      pushHistory(bookId, s, shift(start, 0, i - 2)),
    );

    const fee = Math.round(price * PLATFORM_FEE_RATE);
    invoices.push({
      id: uuid(nextId(), 'inv'),
      booking_id: bookId,
      provider_id: prov.id,
      customer_id: cust.id,
      line_items: [
        { description: cat.name, description_bn: cat.name_bn, quantity: 1, unit_price: price },
      ],
      subtotal: price,
      platform_fee: fee,
      total: price + fee,
      payment_method: (['bkash', 'nagad', 'cash'] as const)[Math.floor(r() * 3)],
      payment_status: 'paid',
      qr_token: uuid(nextId(), 'qr'),
      generated_at: iso(shift(start, 0, 1)),
      paid_at: iso(shift(start, 0, 2)),
    });

    if (r() > 0.25) {
      reviews.push({
        id: uuid(nextId(), 'rev'),
        booking_id: bookId,
        customer_id: cust.id,
        provider_id: prov.id,
        rating: r() > 0.78 ? 4 : 5,
        comment: COMMENTS[Math.floor(r() * COMMENTS.length)],
        created_at: iso(shift(start, 0, 5)),
      });
    }
    return seq;
  }

  // Six months of history — enough to fill the finance and analytics charts.
  let seq = 0;
  for (let d = 178; d >= 2; d -= 1) {
    const perDay = d < 30 ? 2 + Math.floor(r() * 3) : 1 + Math.floor(r() * 2);
    for (let k = 0; k < perDay; k += 1) seq = completedJob(d, seq);
  }

  // Provider costs across the same window.
  for (const prov of providers) {
    for (let d = 175; d >= 1; d -= 4 + Math.floor(r() * 6)) {
      const item = COST_ITEMS[Math.floor(r() * COST_ITEMS.length)];
      provider_costs.push({
        id: uuid(nextId(), 'cost'),
        provider_id: prov.id,
        description: item.desc,
        amount: Math.round((item.min + r() * (item.max - item.min)) / 10) * 10,
        category: item.cat,
        date: day(shift(now, -d)),
        booking_id: null,
        created_at: iso(shift(now, -d)),
      });
    }
  }

  // ── Live demo rows ────────────────────────────────────────────────
  // The brief's own example: AC repair, Dhanmondi, 4–6 PM, normal urgency.
  const ayesha = customers[0];
  const rahim = providers[0];
  const dhanmondi = areaOf('Dhanmondi');

  const liveReqId = uuid(9001, 'req');
  requests.push({
    id: liveReqId,
    customer_id: ayesha.id,
    service_category_id: 'appliance',
    area: 'Dhanmondi',
    address: ayesha.address,
    lat: dhanmondi.lat,
    lng: dhanmondi.lng,
    preferred_date: day(now),
    preferred_time_window: '16:00-18:00',
    urgency: 'normal',
    problem_description: 'Split AC in the bedroom is running but not cooling. Water dripping from the indoor unit.',
    image_url: null,
    status: 'booked',
    created_at: iso(shift(now, 0, -4)),
  });

  const liveBookingId = uuid(9002, 'book');
  bookings.push({
    id: liveBookingId,
    request_id: liveReqId,
    provider_id: rahim.id,
    customer_id: ayesha.id,
    confirmed_date: day(now),
    confirmed_slot: '16:00-18:00',
    agreed_price: 1400,
    status: 'in_progress',
    cancel_reason: null,
    created_at: iso(shift(now, 0, -4)),
    updated_at: iso(shift(now, 0, -1)),
  });
  (['requested', 'accepted', 'on_the_way', 'in_progress'] as const).forEach((s, i) =>
    pushHistory(liveBookingId, s, shift(now, 0, -4 + i)),
  );

  // A pending invoice sitting behind a scannable QR — the demo moment.
  const liveFee = Math.round(1400 * PLATFORM_FEE_RATE);
  invoices.push({
    id: uuid(9003, 'inv'),
    booking_id: liveBookingId,
    provider_id: rahim.id,
    customer_id: ayesha.id,
    line_items: [
      { description: 'AC servicing & gas refill', description_bn: 'এসি সার্ভিসিং ও গ্যাস রিফিল', quantity: 1, unit_price: 1200 },
      { description: 'Drain pipe replacement', description_bn: 'ড্রেন পাইপ প্রতিস্থাপন', quantity: 1, unit_price: 200 },
    ],
    subtotal: 1400,
    platform_fee: liveFee,
    total: 1400 + liveFee,
    payment_method: null,
    payment_status: 'pending',
    qr_token: 'a1b2c3d4-0000-4000-8000-000000009003',
    generated_at: iso(shift(now, 0, -1)),
    paid_at: null,
  });

  // An open request with three suggested matches waiting for a decision.
  const openReqId = uuid(9010, 'req');
  const mirpur = areaOf('Mirpur');
  requests.push({
    id: openReqId,
    customer_id: customers[2].id,
    service_category_id: 'plumbing',
    area: 'Mirpur',
    address: customers[2].address,
    lat: mirpur.lat,
    lng: mirpur.lng,
    preferred_date: day(shift(now, 1)),
    preferred_time_window: '10:00-12:00',
    urgency: 'urgent',
    problem_description: 'Water pipe burst under the basin, floor is flooding.',
    image_url: null,
    status: 'matched',
    created_at: iso(shift(now, 0, -2)),
  });
  providers
    .filter((p) => p.service_categories.includes('plumbing'))
    .slice(0, 3)
    .forEach((p, i) => {
      request_matches.push({
        id: uuid(9020 + i, 'match'),
        request_id: openReqId,
        provider_id: p.id,
        match_score: 0.9 - i * 0.07,
        score_breakdown: {
          total: 0.9 - i * 0.07,
          components: [],
          quoted_price: 800 + i * 100,
          distance_km: 1.8 + i * 1.4,
          slot: '10:00-12:00',
        },
        status: 'suggested',
        created_at: iso(shift(now, 0, -2)),
      });
    });

  // Two jobs waiting in providers' queues so the dashboard is never empty.
  [
    { prov: providers[3], cust: customers[1], cat: 'electrical', status: 'requested' as const, slot: '14:00-16:00', price: 1100 },
    { prov: providers[5], cust: customers[4], cat: 'cleaning', status: 'accepted' as const, slot: '08:00-10:00', price: 2200 },
  ].forEach((row, i) => {
    const area = areaOf(row.cust.area);
    const reqId = uuid(9030 + i, 'req');
    const bookId = uuid(9040 + i, 'book');
    requests.push({
      id: reqId,
      customer_id: row.cust.id,
      service_category_id: row.cat,
      area: area.name,
      address: row.cust.address,
      lat: area.lat,
      lng: area.lng,
      preferred_date: day(shift(now, i)),
      preferred_time_window: row.slot,
      urgency: 'normal',
      problem_description: PROBLEMS[row.cat][0],
      image_url: null,
      status: 'booked',
      created_at: iso(shift(now, 0, -5 - i)),
    });
    bookings.push({
      id: bookId,
      request_id: reqId,
      provider_id: row.prov.id,
      customer_id: row.cust.id,
      confirmed_date: day(shift(now, i)),
      confirmed_slot: row.slot,
      agreed_price: row.price,
      status: row.status,
      cancel_reason: null,
      created_at: iso(shift(now, 0, -5 - i)),
      updated_at: iso(shift(now, 0, -5 - i)),
    });
    pushHistory(bookId, 'requested', shift(now, 0, -5 - i));
    if (row.status === 'accepted') pushHistory(bookId, 'accepted', shift(now, 0, -4 - i));
  });

  // ── Derived aggregates ────────────────────────────────────────────
  for (const p of providers) {
    const paid = invoices.filter((inv) => inv.provider_id === p.id && inv.payment_status === 'paid');
    const done = bookings.filter((b) => b.provider_id === p.id && b.status === 'completed').length;
    const earned = paid.reduce((s, inv) => s + inv.subtotal, 0);
    // Seeded totals include pre-platform history, so keep the larger figure.
    p.completed_jobs_count = Math.max(p.completed_jobs_count, done);
    p.total_earnings = Math.max(p.total_earnings, earned);
    p.total_costs = provider_costs
      .filter((c) => c.provider_id === p.id)
      .reduce((s, c) => s + c.amount, p.total_costs);
    p.tier = tierFor(p.completed_jobs_count, p.total_earnings).tier_name as TierName;
  }

  const loyalty: Loyalty[] = customers.map((c) => {
    const rated = reviews.filter((rv) => rv.customer_id === c.id).length;
    const coupons = [
      { at: 3, code: 'THIK50' },
      { at: 7, code: 'THIK150' },
      { at: 15, code: 'THIK400' },
    ]
      .filter((x) => rated >= x.at)
      .map((x) => x.code);
    return { customer_id: c.id, points: rated * 20, rated_bookings: rated, coupons_unlocked: coupons };
  });

  const challenges: Challenge[] = providers.flatMap((p, i) => [
    {
      id: uuid(9100 + i * 3, 'chal'),
      provider_id: p.id,
      type: 'daily' as const,
      title: 'Complete 3 jobs today',
      title_bn: 'আজ ৩টি কাজ শেষ করুন',
      goal: 3,
      progress: Math.floor(r() * 3),
      reward: 200,
      status: 'active' as const,
      ends_at: iso(shift(now, 1)),
    },
    {
      id: uuid(9101 + i * 3, 'chal'),
      provider_id: p.id,
      type: 'weekly' as const,
      title: 'Keep a 4.5+ rating across 10 jobs',
      title_bn: '১০টি কাজে ৪.৫+ রেটিং ধরে রাখুন',
      goal: 10,
      progress: 4 + Math.floor(r() * 6),
      reward: 800,
      status: 'active' as const,
      ends_at: iso(shift(now, 5)),
    },
    {
      id: uuid(9102 + i * 3, 'chal'),
      provider_id: p.id,
      type: 'monthly' as const,
      title: '20 jobs this month with zero cancellations',
      title_bn: 'এই মাসে ২০টি কাজ, একটিও বাতিল নয়',
      goal: 20,
      progress: 6 + Math.floor(r() * 12),
      reward: 2500,
      status: 'active' as const,
      ends_at: iso(shift(now, 20)),
    },
  ]);

  const reported_issues: ReportedIssue[] = bookings
    .filter((b) => b.status === 'completed')
    .slice(0, 3)
    .map((b, i) => ({
      id: uuid(9200 + i, 'issue'),
      booking_id: b.id,
      reported_by_customer_id: b.customer_id,
      reason: [
        'Provider arrived 90 minutes after the agreed slot.',
        'Problem came back the next day, work was not durable.',
        'Charged more than the quoted price at the door.',
      ][i],
      status: (['open', 'open', 'escalated'] as const)[i],
      admin_note: null,
      created_at: iso(shift(now, -2 - i)),
    }));

  const admin_announcements: AdminAnnouncement[] = [
    {
      id: uuid(9300, 'ann'),
      target_role: 'providers',
      message: 'Heavy rain expected across Dhaka tomorrow. Update your availability if you cannot travel.',
      message_bn: 'আগামীকাল ঢাকায় ভারী বৃষ্টির সম্ভাবনা। যাতায়াত করতে না পারলে আপনার সময়সূচি আপডেট করুন।',
      urgency: 'urgent',
      sent_at: iso(shift(now, -1)),
      sent_by_admin_id: 'admin',
    },
    {
      id: uuid(9301, 'ann'),
      target_role: 'customers',
      message: 'Rate your completed jobs to unlock discount coupons on your next booking.',
      message_bn: 'পরবর্তী বুকিংয়ে ছাড়ের কুপন পেতে সম্পন্ন কাজগুলোতে রেটিং দিন।',
      urgency: 'normal',
      sent_at: iso(shift(now, -6)),
      sent_by_admin_id: 'admin',
    },
  ];

  return {
    customers,
    providers,
    service_categories: CATEGORIES,
    requests,
    request_matches,
    bookings,
    status_history,
    reviews,
    loyalty,
    challenges,
    provider_tiers: TIERS,
    invoices,
    provider_costs,
    admin_announcements,
    reported_issues,
  };
}
