// ── ThikKori domain model ────────────────────────────────────────────
// These types mirror the Postgres schema in supabase/migrations/0001_schema.sql
// one-to-one. Both data adapters (local + Supabase) return exactly these shapes.

export type Locale = 'en' | 'bn';

export type Urgency = 'normal' | 'urgent' | 'emergency';

export type BookingStatus =
  | 'requested'
  | 'accepted'
  | 'on_the_way'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type RequestStatus = 'open' | 'matched' | 'booked' | 'cancelled' | 'closed';

export type MatchStatus = 'suggested' | 'chosen' | 'declined' | 'expired';

export type PaymentStatus = 'pending' | 'paid';

export type PaymentMethod = 'bkash' | 'nagad' | 'cash';

export type TierName = 'beginner' | 'rising' | 'pro' | 'expert' | 'master';

export type CostCategory = 'tools' | 'transport' | 'materials' | 'other';

export type ChallengeType = 'daily' | 'weekly' | 'monthly';

export type IssueStatus = 'open' | 'resolved' | 'escalated';

export type AnnouncementTarget = 'all' | 'customers' | 'providers';

export interface Customer {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  area: string;
  address: string;
  trust_score: number;
  preferred_language: Locale;
  suspended: boolean;
  created_at: string;
}

export interface Provider {
  id: string;
  name: string;
  email: string;
  password?: string;
  business_name: string;
  phone: string;
  service_categories: string[];
  rating: number;
  ratings_count: number;
  completed_jobs_count: number;
  total_earnings: number;
  total_costs: number;
  tier: TierName;
  base_area: string;
  base_lat: number;
  base_lng: number;
  service_radius_km: number;
  hourly_rate: number;
  qr_code_url: string;
  preferred_language: Locale;
  is_online: boolean;
  suspended: boolean;
  flagged_for_review: boolean;
  created_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  name_bn: string;
  icon: string;
  base_price: number;
  active: boolean;
  sort_order: number;
}

export interface ServiceRequest {
  id: string;
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
  status: RequestStatus;
  created_at: string;
}

export interface ScoreComponent {
  key: 'availability' | 'distance' | 'rating' | 'price' | 'expertise' | 'tier';
  /** Raw 0..1 sub-score for this factor. */
  raw: number;
  /** Configured weight for this factor. */
  weight: number;
  /** raw * weight — the factor's absolute contribution to the final score. */
  contribution: number;
  /** contribution / total score — the share shown in the explainable UI. */
  share: number;
  /** Human-readable evidence, e.g. "2.3 km away". Numbers stay raw for i18n. */
  detail: { value: number; unit: string; extra?: string };
}

export interface ScoreBreakdown {
  total: number;
  components: ScoreComponent[];
  quoted_price: number;
  distance_km: number;
  slot: string;
}

export interface RequestMatch {
  id: string;
  request_id: string;
  provider_id: string;
  match_score: number;
  score_breakdown: ScoreBreakdown;
  status: MatchStatus;
  created_at: string;
}

export interface Booking {
  id: string;
  request_id: string;
  provider_id: string;
  customer_id: string;
  confirmed_date: string;
  confirmed_slot: string;
  agreed_price: number;
  status: BookingStatus;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface StatusHistoryEntry {
  id: string;
  booking_id: string;
  status: BookingStatus;
  note: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  provider_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Loyalty {
  customer_id: string;
  points: number;
  rated_bookings: number;
  coupons_unlocked: string[];
}

export interface Challenge {
  id: string;
  provider_id: string;
  type: ChallengeType;
  title: string;
  title_bn: string;
  goal: number;
  progress: number;
  reward: number;
  status: 'active' | 'completed' | 'expired';
  ends_at: string;
}

export interface ProviderTier {
  tier_name: TierName;
  min_jobs: number;
  min_earnings: number;
  match_score_bonus: number;
  max_wage_multiplier: number;
}

export interface InvoiceLineItem {
  description: string;
  description_bn: string;
  quantity: number;
  unit_price: number;
}

export interface Invoice {
  id: string;
  booking_id: string;
  provider_id: string;
  customer_id: string;
  line_items: InvoiceLineItem[];
  subtotal: number;
  platform_fee: number;
  total: number;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  qr_token: string;
  generated_at: string;
  paid_at: string | null;
}

export interface ProviderCost {
  id: string;
  provider_id: string;
  description: string;
  amount: number;
  category: CostCategory;
  date: string;
  booking_id: string | null;
  created_at: string;
}

export interface AdminAnnouncement {
  id: string;
  target_role: AnnouncementTarget;
  message: string;
  message_bn: string;
  urgency: 'normal' | 'urgent';
  sent_at: string;
  sent_by_admin_id: string;
}

export interface ReportedIssue {
  id: string;
  booking_id: string;
  reported_by_customer_id: string;
  reason: string;
  status: IssueStatus;
  admin_note: string | null;
  created_at: string;
}

/** The complete relational snapshot the app renders from. */
export interface Database {
  customers: Customer[];
  providers: Provider[];
  service_categories: ServiceCategory[];
  requests: ServiceRequest[];
  request_matches: RequestMatch[];
  bookings: Booking[];
  status_history: StatusHistoryEntry[];
  reviews: Review[];
  loyalty: Loyalty[];
  challenges: Challenge[];
  provider_tiers: ProviderTier[];
  invoices: Invoice[];
  provider_costs: ProviderCost[];
  admin_announcements: AdminAnnouncement[];
  reported_issues: ReportedIssue[];
}

export type TableName = keyof Database;
