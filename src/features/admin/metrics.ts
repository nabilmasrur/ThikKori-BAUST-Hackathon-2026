import { monthKey } from '@/lib/format';
import type { Database } from '@/types';

const isToday = (iso: string) => iso.slice(0, 10) === new Date().toISOString().slice(0, 10);

export interface PlatformMetrics {
  requestsToday: number;
  activeBookings: number;
  pendingRequests: number;
  providersOnline: number;
  customers: number;
  revenue: number;
  revenueThisMonth: number;
  avgMatchScore: number;
  avgCompletionHours: number;
  openIssues: number;
}

export function platformMetrics(db: Database): PlatformMetrics {
  const paid = db.invoices.filter((i) => i.payment_status === 'paid');
  const thisMonth = monthKey(new Date().toISOString());

  // Completion time: first `requested` stamp to the `completed` stamp.
  const durations: number[] = [];
  for (const b of db.bookings.filter((x) => x.status === 'completed')) {
    const rows = db.status_history.filter((h) => h.booking_id === b.id);
    const start = rows.find((h) => h.status === 'requested')?.created_at;
    const end = rows.find((h) => h.status === 'completed')?.created_at;
    if (start && end) {
      const hours = (new Date(end).getTime() - new Date(start).getTime()) / 36e5;
      if (hours >= 0 && hours < 240) durations.push(hours);
    }
  }

  const scores = db.request_matches.map((m) => m.match_score).filter((n) => Number.isFinite(n));

  return {
    requestsToday: db.requests.filter((r) => isToday(r.created_at)).length,
    activeBookings: db.bookings.filter((b) => ['accepted', 'on_the_way', 'in_progress'].includes(b.status)).length,
    pendingRequests: db.requests.filter((r) => r.status === 'open' || r.status === 'matched').length,
    providersOnline: db.providers.filter((p) => p.is_online && !p.suspended).length,
    customers: db.customers.length,
    revenue: paid.reduce((s, i) => s + i.platform_fee, 0),
    revenueThisMonth: paid
      .filter((i) => monthKey(i.paid_at ?? '') === thisMonth)
      .reduce((s, i) => s + i.platform_fee, 0),
    avgMatchScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    avgCompletionHours: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
    openIssues: db.reported_issues.filter((i) => i.status !== 'resolved').length,
  };
}

/** Requests per day for the last N days, oldest first. */
export function requestsPerDay(db: Database, days = 30) {
  const out: { day: string; label: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({
      day: key,
      label: `${d.getDate()}`,
      count: db.requests.filter((r) => r.created_at.slice(0, 10) === key).length,
    });
  }
  return out;
}

export function revenueByMonth(db: Database, months = 6) {
  const out: { key: string; monthIndex: number; revenue: number }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    out.push({
      key,
      monthIndex: d.getMonth(),
      revenue: db.invoices
        .filter((inv) => inv.payment_status === 'paid' && monthKey(inv.paid_at ?? '') === key)
        .reduce((s, inv) => s + inv.platform_fee, 0),
    });
  }
  return out;
}
