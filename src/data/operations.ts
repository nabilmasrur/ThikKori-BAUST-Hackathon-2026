import type { DataAdapter } from '@/data/adapter';
import { LOYALTY_THRESHOLDS, PLATFORM_FEE_RATE, POINTS_PER_RATING, TIME_WINDOWS } from '@/lib/constants';
import { scoreProviders, tierFor } from '@/lib/matching';
import type {
  AnnouncementTarget,
  Booking,
  BookingStatus,
  CostCategory,
  Database,
  Invoice,
  PaymentMethod,
  RequestMatch,
  ServiceRequest,
  TierName,
  Urgency,
} from '@/types';

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}

const now = () => new Date().toISOString();

// ── Customer side ────────────────────────────────────────────────────

export interface NewRequestInput {
  customer_id: string;
  service_category_id: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
  preferred_date: string;
  preferred_time_window: string;
  urgency: Urgency;
  problem_description: string;
  image_url: string | null;
}

/**
 * Creates the request and immediately writes the computed top-3 matches,
 * breakdown included. The explanation the customer sees is the same data the
 * ranking used — nothing is recomputed for display.
 */
export async function createRequestWithMatches(
  adapter: DataAdapter,
  db: Database,
  input: NewRequestInput,
): Promise<{ request: ServiceRequest; matches: RequestMatch[] }> {
  const request: ServiceRequest = {
    id: newId(),
    ...input,
    status: 'open',
    created_at: now(),
  };

  const category = db.service_categories.find((c) => c.id === input.service_category_id);
  const ranked = category
    ? scoreProviders({
        request,
        category,
        providers: db.providers,
        bookings: db.bookings,
        windows: TIME_WINDOWS,
      }).slice(0, 3)
    : [];

  const matches: RequestMatch[] = ranked.map((r) => ({
    id: newId(),
    request_id: request.id,
    provider_id: r.provider.id,
    match_score: r.breakdown.total,
    score_breakdown: r.breakdown,
    status: 'suggested',
    created_at: now(),
  }));

  request.status = matches.length ? 'matched' : 'open';
  await adapter.insert('requests', [request]);
  if (matches.length) await adapter.insert('request_matches', matches);
  return { request, matches };
}

export async function confirmBooking(
  adapter: DataAdapter,
  db: Database,
  args: { request: ServiceRequest; match: RequestMatch },
): Promise<Booking> {
  const { request, match } = args;
  const slot = match.score_breakdown.slot || request.preferred_time_window;

  // Double-booking guard, mirrored by the DB unique index on
  // (provider_id, confirmed_date, confirmed_slot) for live bookings.
  const clash = db.bookings.some(
    (b) =>
      b.provider_id === match.provider_id &&
      b.confirmed_date === request.preferred_date &&
      b.confirmed_slot === slot &&
      b.status !== 'cancelled',
  );
  if (clash) throw new Error('slot_taken');

  const booking: Booking = {
    id: newId(),
    request_id: request.id,
    provider_id: match.provider_id,
    customer_id: request.customer_id,
    confirmed_date: request.preferred_date,
    confirmed_slot: slot,
    agreed_price: match.score_breakdown.quoted_price,
    status: 'requested',
    cancel_reason: null,
    created_at: now(),
    updated_at: now(),
  };

  await adapter.insert('bookings', [booking]);
  await adapter.insert('status_history', [
    { id: newId(), booking_id: booking.id, status: 'requested', note: null, created_at: now() },
  ]);
  await adapter.update('requests', request.id, { status: 'booked' });
  await adapter.update('request_matches', match.id, { status: 'chosen' });
  for (const other of db.request_matches.filter(
    (m) => m.request_id === request.id && m.id !== match.id,
  )) {
    await adapter.update('request_matches', other.id, { status: 'declined' });
  }
  return booking;
}

// ── Status machine ───────────────────────────────────────────────────

export const NEXT_STATUS: Partial<Record<BookingStatus, BookingStatus>> = {
  requested: 'accepted',
  accepted: 'on_the_way',
  on_the_way: 'in_progress',
};

/**
 * Advance a booking one step. Reaching `in_progress` auto-generates the
 * pending invoice behind the payment QR — no manual invoicing step exists.
 */
export async function advanceBooking(
  adapter: DataAdapter,
  db: Database,
  booking: Booking,
  to: BookingStatus,
): Promise<void> {
  await adapter.update('bookings', booking.id, { status: to, updated_at: now() });
  await adapter.insert('status_history', [
    { id: newId(), booking_id: booking.id, status: to, note: null, created_at: now() },
  ]);

  if (to === 'in_progress') {
    const existing = db.invoices.find((i) => i.booking_id === booking.id);
    if (!existing) await generateInvoice(adapter, db, booking);
  }
}

export async function generateInvoice(
  adapter: DataAdapter,
  db: Database,
  booking: Booking,
): Promise<Invoice> {
  const request = db.requests.find((r) => r.id === booking.request_id);
  const category = db.service_categories.find((c) => c.id === request?.service_category_id);
  const subtotal = booking.agreed_price;
  const platform_fee = Math.round(subtotal * PLATFORM_FEE_RATE);
  const invoice: Invoice = {
    id: newId(),
    booking_id: booking.id,
    provider_id: booking.provider_id,
    customer_id: booking.customer_id,
    line_items: [
      {
        description: category?.name ?? 'Home service',
        description_bn: category?.name_bn ?? 'ঘরোয়া সেবা',
        quantity: 1,
        unit_price: subtotal,
      },
    ],
    subtotal,
    platform_fee,
    total: subtotal + platform_fee,
    payment_method: null,
    payment_status: 'pending',
    qr_token: newId(),
    generated_at: now(),
    paid_at: null,
  };
  await adapter.insert('invoices', [invoice]);
  return invoice;
}

export async function rejectBooking(
  adapter: DataAdapter,
  booking: Booking,
  reason: string,
): Promise<void> {
  await adapter.update('bookings', booking.id, {
    status: 'cancelled',
    cancel_reason: reason,
    updated_at: now(),
  });
  await adapter.insert('status_history', [
    { id: newId(), booking_id: booking.id, status: 'cancelled', note: reason, created_at: now() },
  ]);
  await adapter.update('requests', booking.request_id, { status: 'open' });
}

// ── Payment ──────────────────────────────────────────────────────────

/**
 * The QR flow's single write path: marking an invoice paid also completes
 * the booking, stamps history, and rolls the provider's earnings and tier.
 */
export async function payInvoice(
  adapter: DataAdapter,
  db: Database,
  invoice: Invoice,
  method: PaymentMethod,
): Promise<void> {
  if (invoice.payment_status === 'paid') return;
  const paidAt = now();
  await adapter.update('invoices', invoice.id, {
    payment_status: 'paid',
    payment_method: method,
    paid_at: paidAt,
  });

  const booking = db.bookings.find((b) => b.id === invoice.booking_id);
  if (booking && booking.status !== 'completed') {
    await adapter.update('bookings', booking.id, { status: 'completed', updated_at: paidAt });
    await adapter.insert('status_history', [
      {
        id: newId(),
        booking_id: booking.id,
        status: 'completed',
        note: `paid_via:${method}`,
        created_at: paidAt,
      },
    ]);
    await adapter.update('requests', booking.request_id, { status: 'closed' });
  }

  const provider = db.providers.find((p) => p.id === invoice.provider_id);
  if (provider) {
    const jobs = provider.completed_jobs_count + 1;
    const earnings = provider.total_earnings + invoice.subtotal;
    await adapter.update('providers', provider.id, {
      completed_jobs_count: jobs,
      total_earnings: earnings,
      tier: tierFor(jobs, earnings).tier_name as TierName,
    });
  }

  // Daily/weekly/monthly challenge progress ticks on completion.
  for (const ch of db.challenges.filter(
    (c) => c.provider_id === invoice.provider_id && c.status === 'active',
  )) {
    const progress = Math.min(ch.goal, ch.progress + 1);
    await adapter.update('challenges', ch.id, {
      progress,
      status: progress >= ch.goal ? 'completed' : 'active',
    });
  }
}

// ── Reviews & loyalty ────────────────────────────────────────────────

export async function submitReview(
  adapter: DataAdapter,
  db: Database,
  args: { booking: Booking; rating: number; comment: string },
): Promise<string[]> {
  const { booking, rating, comment } = args;
  await adapter.insert('reviews', [
    {
      id: newId(),
      booking_id: booking.id,
      customer_id: booking.customer_id,
      provider_id: booking.provider_id,
      rating,
      comment,
      created_at: now(),
    },
  ]);

  const provider = db.providers.find((p) => p.id === booking.provider_id);
  if (provider) {
    const count = provider.ratings_count + 1;
    const avg = (provider.rating * provider.ratings_count + rating) / count;
    await adapter.update('providers', provider.id, {
      rating: Math.round(avg * 100) / 100,
      ratings_count: count,
    });
  }

  const existing = db.loyalty.find((l) => l.customer_id === booking.customer_id);
  const rated = (existing?.rated_bookings ?? 0) + 1;
  const points = (existing?.points ?? 0) + POINTS_PER_RATING;
  const unlocked = LOYALTY_THRESHOLDS.filter((t) => rated >= t.rated).map((t) => t.coupon);
  const fresh = unlocked.filter((c) => !(existing?.coupons_unlocked ?? []).includes(c));

  if (existing) {
    await adapter.update('loyalty', booking.customer_id, {
      points,
      rated_bookings: rated,
      coupons_unlocked: unlocked,
    });
  } else {
    await adapter.insert('loyalty', [
      { customer_id: booking.customer_id, points, rated_bookings: rated, coupons_unlocked: unlocked },
    ]);
  }
  return fresh;
}

// ── Provider finances ────────────────────────────────────────────────

export async function logCost(
  adapter: DataAdapter,
  args: {
    provider_id: string;
    description: string;
    amount: number;
    category: CostCategory;
    date: string;
    booking_id: string | null;
  },
): Promise<void> {
  // Monthly and all-time cost totals are derived from these rows on read,
  // so there is no denormalised counter to keep in sync here.
  await adapter.insert('provider_costs', [{ id: newId(), created_at: now(), ...args }]);
}

// ── Admin ────────────────────────────────────────────────────────────

export async function forceCancelBooking(
  adapter: DataAdapter,
  booking: Booking,
  reason: string,
): Promise<void> {
  await adapter.update('bookings', booking.id, {
    status: 'cancelled',
    cancel_reason: reason,
    updated_at: now(),
  });
  await adapter.insert('status_history', [
    { id: newId(), booking_id: booking.id, status: 'cancelled', note: reason, created_at: now() },
  ]);
  await adapter.update('requests', booking.request_id, { status: 'cancelled' });
}

export async function reassignBooking(
  adapter: DataAdapter,
  booking: Booking,
  providerId: string,
): Promise<void> {
  await adapter.update('bookings', booking.id, {
    provider_id: providerId,
    status: 'accepted',
    updated_at: now(),
  });
  await adapter.insert('status_history', [
    {
      id: newId(),
      booking_id: booking.id,
      status: 'accepted',
      note: 'reassigned_by_admin',
      created_at: now(),
    },
  ]);
}

export async function broadcastAnnouncement(
  adapter: DataAdapter,
  args: {
    target_role: AnnouncementTarget;
    message: string;
    message_bn: string;
    urgency: 'normal' | 'urgent';
  },
): Promise<void> {
  await adapter.insert('admin_announcements', [
    { id: newId(), sent_at: now(), sent_by_admin_id: 'admin', ...args },
  ]);
}

export async function reportIssue(
  adapter: DataAdapter,
  args: { booking_id: string; reported_by_customer_id: string; reason: string },
): Promise<void> {
  await adapter.insert('reported_issues', [
    { id: newId(), status: 'open', admin_note: null, created_at: now(), ...args },
  ]);
}
