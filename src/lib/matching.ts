// Relative rather than aliased: the seed generator loads this module in
// plain Node, where the Vite "@" alias does not exist.
import { MATCH_WEIGHTS, TIERS } from './constants';
import type {
  Booking,
  Provider,
  ScoreBreakdown,
  ScoreComponent,
  ServiceCategory,
  ServiceRequest,
} from '@/types';

/** Great-circle distance in km. */
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 10) / 10;
}

export function tierBonus(provider: Provider): number {
  return TIERS.find((t) => t.tier_name === provider.tier)?.match_score_bonus ?? 0;
}

export function wageMultiplier(provider: Provider): number {
  return TIERS.find((t) => t.tier_name === provider.tier)?.max_wage_multiplier ?? 1;
}

/** Slots the provider has not already committed to on that date. */
export function freeSlots(
  provider: Provider,
  date: string,
  bookings: Booking[],
  windows: readonly string[],
): string[] {
  const taken = new Set(
    bookings
      .filter(
        (b) =>
          b.provider_id === provider.id &&
          b.confirmed_date === date &&
          b.status !== 'cancelled',
      )
      .map((b) => b.confirmed_slot),
  );
  return windows.filter((w) => !taken.has(w));
}

/**
 * Quoted price = category base price × tier wage multiplier × urgency premium,
 * rounded to the nearest ৳50 so quotes look like real quotes.
 */
export function quotePrice(
  provider: Provider,
  category: ServiceCategory,
  request: ServiceRequest,
): number {
  const urgencyPremium = request.urgency === 'emergency' ? 1.35 : request.urgency === 'urgent' ? 1.15 : 1;
  const raw = category.base_price * wageMultiplier(provider) * urgencyPremium;
  return Math.round(raw / 50) * 50;
}

export interface ScoredProvider {
  provider: Provider;
  breakdown: ScoreBreakdown;
}

interface ScoreInput {
  request: ServiceRequest;
  category: ServiceCategory;
  providers: Provider[];
  bookings: Booking[];
  windows: readonly string[];
}

/**
 * The heart of the platform: rank providers for one request and keep the
 * arithmetic so the UI can explain *why* each provider was recommended.
 */
export function scoreProviders({
  request,
  category,
  providers,
  bookings,
  windows,
}: ScoreInput): ScoredProvider[] {
  const eligible = providers.filter(
    (p) =>
      !p.suspended &&
      p.service_categories.includes(category.id) &&
      haversineKm(request.lat, request.lng, p.base_lat, p.base_lng) <= p.service_radius_km,
  );

  const quotes = eligible.map((p) => quotePrice(p, category, request));
  const minQuote = Math.min(...quotes, category.base_price);
  const maxQuote = Math.max(...quotes, category.base_price);

  const scored = eligible.map((provider) => {
    const open = freeSlots(provider, request.preferred_date, bookings, windows);
    const wantsWindow = request.preferred_time_window;
    const hasExactWindow = open.includes(wantsWindow);
    const slot = hasExactWindow ? wantsWindow : open[0] ?? '';

    // ── Availability ──────────────────────────────────────────────
    // Exact requested window = 1.0; any other slot the same day decays
    // with how far it sits from the requested window; nothing free = 0.
    let availability = 0;
    if (hasExactWindow) availability = 1;
    else if (open.length) {
      const wantIdx = windows.indexOf(wantsWindow);
      const gotIdx = windows.indexOf(slot);
      availability = Math.max(0.35, 1 - Math.abs(wantIdx - gotIdx) * 0.18);
    }
    if (provider.is_online) availability = Math.min(1, availability + 0.05);

    // ── Distance ──────────────────────────────────────────────────
    const distance_km = haversineKm(request.lat, request.lng, provider.base_lat, provider.base_lng);
    const distance = Math.max(0, 1 - distance_km / provider.service_radius_km);

    // ── Rating ────────────────────────────────────────────────────
    // Normalised over the usable 3.0–5.0 band; unrated providers sit mid-band.
    const rating = provider.ratings_count === 0 ? 0.5 : clamp((provider.rating - 3) / 2);

    // ── Price ─────────────────────────────────────────────────────
    const quoted_price = quotePrice(provider, category, request);
    const price = maxQuote === minQuote ? 1 : 1 - (quoted_price - minQuote) / (maxQuote - minQuote);

    // ── Expertise ─────────────────────────────────────────────────
    // Specialists (few categories, many jobs) beat generalists.
    const focus = 1 / Math.max(1, provider.service_categories.length);
    const volume = Math.min(1, provider.completed_jobs_count / 120);
    const expertise = clamp(0.45 * focus + 0.55 * volume);

    // ── Tier bonus ────────────────────────────────────────────────
    const tier = tierBonus(provider);

    const raws = { availability, distance, rating, price, expertise, tier };
    const components: ScoreComponent[] = (
      Object.keys(MATCH_WEIGHTS) as (keyof typeof MATCH_WEIGHTS)[]
    ).map((key) => {
      const weight = MATCH_WEIGHTS[key];
      const raw = clamp(raws[key]);
      return {
        key,
        raw,
        weight,
        contribution: raw * weight,
        share: 0,
        detail: detailFor(key, {
          distance_km,
          rating: provider.rating,
          ratings_count: provider.ratings_count,
          quoted_price,
          slot,
          jobs: provider.completed_jobs_count,
          tierName: provider.tier,
        }),
      };
    });

    const total = components.reduce((sum, c) => sum + c.contribution, 0);
    for (const c of components) c.share = total > 0 ? c.contribution / total : 0;

    const breakdown: ScoreBreakdown = {
      total: Math.round(total * 1000) / 1000,
      components,
      quoted_price,
      distance_km,
      slot,
    };
    return { provider, breakdown };
  });

  return scored
    .filter((s) => s.breakdown.slot !== '')
    .sort((a, b) => b.breakdown.total - a.breakdown.total);
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function detailFor(
  key: keyof typeof MATCH_WEIGHTS,
  ctx: {
    distance_km: number;
    rating: number;
    ratings_count: number;
    quoted_price: number;
    slot: string;
    jobs: number;
    tierName: string;
  },
): ScoreComponent['detail'] {
  switch (key) {
    case 'availability':
      return { value: 0, unit: 'slot', extra: ctx.slot };
    case 'distance':
      return { value: ctx.distance_km, unit: 'km' };
    case 'rating':
      return { value: ctx.rating, unit: 'stars', extra: String(ctx.ratings_count) };
    case 'price':
      return { value: ctx.quoted_price, unit: 'taka' };
    case 'expertise':
      return { value: ctx.jobs, unit: 'jobs' };
    case 'tier':
      return { value: 0, unit: 'tier', extra: ctx.tierName };
  }
}

/** Recompute a provider's tier from live totals. */
export function tierFor(completedJobs: number, earnings: number) {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (completedJobs >= t.min_jobs && earnings >= t.min_earnings) current = t;
  }
  return current;
}

export function nextTier(tierName: string) {
  const idx = TIERS.findIndex((t) => t.tier_name === tierName);
  return idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}
