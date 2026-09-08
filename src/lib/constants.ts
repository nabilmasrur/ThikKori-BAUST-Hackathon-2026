import type { ProviderTier, TierName } from '@/types';

/**
 * Safe env read. Vite replaces `import.meta.env` at build time; this module is
 * also imported by the plain-Node seed generator, where it is absent.
 */
export function env(key: string, fallback: string): string {
  const bag = (import.meta as unknown as { env?: Record<string, string> }).env;
  const value = bag?.[key];
  return value === undefined || value === '' ? fallback : value;
}

/** Platform commission taken on every invoice. Configurable via env. */
export const PLATFORM_FEE_RATE = Number(env('VITE_PLATFORM_FEE_RATE', '0.05'));

/**
 * Match Score weights.
 *   Match Score = w1·Availability + w2·Distance + w3·Rating
 *               + w4·Price + w5·Expertise + w6·TierBonus
 * Weights sum to 1.0 so the score reads directly as a percentage.
 */
export const MATCH_WEIGHTS = {
  availability: 0.24,
  distance: 0.22,
  rating: 0.24,
  price: 0.16,
  expertise: 0.09,
  tier: 0.05,
} as const;

export const TIERS: ProviderTier[] = [
  { tier_name: 'beginner', min_jobs: 0, min_earnings: 0, match_score_bonus: 0.0, max_wage_multiplier: 1.0 },
  { tier_name: 'rising', min_jobs: 15, min_earnings: 12000, match_score_bonus: 0.25, max_wage_multiplier: 1.1 },
  { tier_name: 'pro', min_jobs: 45, min_earnings: 45000, match_score_bonus: 0.5, max_wage_multiplier: 1.25 },
  { tier_name: 'expert', min_jobs: 110, min_earnings: 120000, match_score_bonus: 0.75, max_wage_multiplier: 1.4 },
  { tier_name: 'master', min_jobs: 220, min_earnings: 260000, match_score_bonus: 1.0, max_wage_multiplier: 1.6 },
];

export const TIER_ORDER: TierName[] = ['beginner', 'rising', 'pro', 'expert', 'master'];

/** Loyalty coupon thresholds, keyed by number of rated bookings. */
export const LOYALTY_THRESHOLDS: { rated: number; coupon: string; discount: number }[] = [
  { rated: 3, coupon: 'THIK50', discount: 50 },
  { rated: 7, coupon: 'THIK150', discount: 150 },
  { rated: 15, coupon: 'THIK400', discount: 400 },
];

export const POINTS_PER_RATING = 20;

export const TIME_WINDOWS = [
  '08:00-10:00',
  '10:00-12:00',
  '12:00-14:00',
  '14:00-16:00',
  '16:00-18:00',
  '18:00-20:00',
] as const;

export const DHAKA_AREAS = [
  { name: 'Dhanmondi', name_bn: 'ধানমন্ডি', lat: 23.7461, lng: 90.376 },
  { name: 'Mirpur', name_bn: 'মিরপুর', lat: 23.8223, lng: 90.3654 },
  { name: 'Gulshan', name_bn: 'গুলশান', lat: 23.7925, lng: 90.4078 },
  { name: 'Uttara', name_bn: 'উত্তরা', lat: 23.8759, lng: 90.3795 },
  { name: 'Banani', name_bn: 'বনানী', lat: 23.7937, lng: 90.4066 },
  { name: 'Mohammadpur', name_bn: 'মোহাম্মদপুর', lat: 23.7654, lng: 90.3591 },
  { name: 'Bashundhara', name_bn: 'বসুন্ধরা', lat: 23.8223, lng: 90.4265 },
];

export const BOOKING_FLOW = [
  'requested',
  'accepted',
  'on_the_way',
  'in_progress',
  'completed',
] as const;

export const ADMIN_EMAIL = env('VITE_ADMIN_EMAIL', 'admin@thikkori.com.bd');
export const ADMIN_PASSWORD = env('VITE_ADMIN_PASSWORD', 'thikkori-admin-2026');

export const PUBLIC_ORIGIN = env(
  'VITE_PUBLIC_ORIGIN',
  typeof window !== 'undefined' ? window.location.origin : 'https://thikkori.app',
);
