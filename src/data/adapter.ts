import type { Database, TableName } from '@/types';

/** Primary key column per table — the local and Supabase adapters share it. */
export const PRIMARY_KEY: Record<TableName, string> = {
  customers: 'id',
  providers: 'id',
  service_categories: 'id',
  requests: 'id',
  request_matches: 'id',
  bookings: 'id',
  status_history: 'id',
  reviews: 'id',
  loyalty: 'customer_id',
  challenges: 'id',
  provider_tiers: 'tier_name',
  invoices: 'id',
  provider_costs: 'id',
  admin_announcements: 'id',
  reported_issues: 'id',
  signup_requests: 'id',
};

export type Row<T extends TableName> = Database[T][number];

export interface DataAdapter {
  readonly kind: 'local' | 'supabase';
  /** Full relational snapshot. The app renders from one snapshot at a time. */
  load(): Promise<Database>;
  /** Fires whenever any table changes, locally or from another device/tab. */
  subscribe(onChange: () => void): () => void;
  insert<T extends TableName>(table: T, rows: Row<T>[]): Promise<void>;
  update<T extends TableName>(table: T, key: string, patch: Partial<Row<T>>): Promise<void>;
  remove<T extends TableName>(table: T, key: string): Promise<void>;
  /** Wipe back to the shipped seed. Local backend only. */
  reset(): Promise<void>;
}

export class BackendUnreachable extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackendUnreachable';
  }
}
