import type { DataAdapter } from '@/data/adapter';
import { LocalAdapter } from '@/data/localAdapter';
import { SupabaseAdapter, supabaseConfigured } from '@/data/supabaseAdapter';

let instance: DataAdapter | null = null;

/**
 * One adapter per browser session. Supabase wins whenever its env vars are
 * present; otherwise the app runs on the zero-setup local backend.
 */
export function getAdapter(): DataAdapter {
  if (!instance) {
    instance = supabaseConfigured ? new SupabaseAdapter() : new LocalAdapter();
  }
  return instance;
}

export { supabaseConfigured };
