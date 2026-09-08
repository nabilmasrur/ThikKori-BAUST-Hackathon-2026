import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { BackendUnreachable, PRIMARY_KEY, type DataAdapter, type Row } from '@/data/adapter';
import { env } from '@/lib/constants';
import type { Database, TableName } from '@/types';

export const SUPABASE_URL = env('VITE_SUPABASE_URL', '');
export const SUPABASE_ANON_KEY = env('VITE_SUPABASE_ANON_KEY', '');

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const TABLES: TableName[] = [
  'customers',
  'providers',
  'service_categories',
  'requests',
  'request_matches',
  'bookings',
  'status_history',
  'reviews',
  'loyalty',
  'challenges',
  'provider_tiers',
  'invoices',
  'provider_costs',
  'admin_announcements',
  'reported_issues',
];

/**
 * Real backend. Same interface as the local adapter, so every screen and
 * every operation in the app is backend-agnostic.
 */
export class SupabaseAdapter implements DataAdapter {
  readonly kind = 'supabase' as const;
  private client: SupabaseClient;
  private listeners = new Set<() => void>();
  private channelReady = false;

  constructor() {
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  private ensureRealtime() {
    if (this.channelReady) return;
    this.channelReady = true;
    this.client
      .channel('thikkori-all')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => this.emit())
      .subscribe();
  }

  async load(): Promise<Database> {
    this.ensureRealtime();
    const results = await Promise.all(
      TABLES.map(async (table) => {
        const { data, error } = await this.client.from(table).select('*');
        if (error) throw new BackendUnreachable(`${table}: ${error.message}`);
        return [table, data ?? []] as const;
      }),
    );
    return Object.fromEntries(results) as unknown as Database;
  }

  subscribe(onChange: () => void) {
    this.ensureRealtime();
    this.listeners.add(onChange);
    return () => {
      this.listeners.delete(onChange);
    };
  }

  async insert<T extends TableName>(table: T, rows: Row<T>[]) {
    const { error } = await this.client.from(table).insert(rows as never);
    if (error) throw new BackendUnreachable(error.message);
  }

  async update<T extends TableName>(table: T, key: string, patch: Partial<Row<T>>) {
    // The generated-types generic is not in play here (this project ships SQL
    // migrations rather than generated types), so the column name is cast once.
    const pk = PRIMARY_KEY[table] as never;
    const { error } = await this.client
      .from(table)
      .update(patch as never)
      .eq(pk, key);
    if (error) throw new BackendUnreachable(error.message);
  }

  async remove<T extends TableName>(table: T, key: string) {
    const pk = PRIMARY_KEY[table] as never;
    const { error } = await this.client.from(table).delete().eq(pk, key);
    if (error) throw new BackendUnreachable(error.message);
  }

  async reset() {
    throw new BackendUnreachable('Reseeding is a database operation. Run supabase/seed.sql instead.');
  }
}
