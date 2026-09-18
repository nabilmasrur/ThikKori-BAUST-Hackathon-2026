import { buildSeed } from '@/data/seed';
import { BackendUnreachable, PRIMARY_KEY, type DataAdapter, type Row } from '@/data/adapter';
import type { Database, TableName } from '@/types';

const STORAGE_KEY = 'thikkori.db.v4';
const CHANNEL = 'thikkori.sync';

/**
 * The zero-setup backend. Everything lives in localStorage; changes are
 * broadcast to every other tab on the machine over BroadcastChannel, which
 * is enough for the two-screen customer/provider demo on one laptop.
 * Point VITE_SUPABASE_URL at a real project to get true cross-device sync.
 */
export class LocalAdapter implements DataAdapter {
  readonly kind = 'local' as const;
  private channel: BroadcastChannel | null = null;
  private listeners = new Set<() => void>();

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL);
      this.channel.onmessage = () => this.emit();
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) this.emit();
      });
    }
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  private read(): Database {
    if (typeof localStorage === 'undefined') {
      throw new BackendUnreachable('Local storage is not available in this browser.');
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = buildSeed();
      this.write(seeded, false);
      return seeded;
    }
    try {
      return JSON.parse(raw) as Database;
    } catch {
      // A corrupted store should not brick the demo — reseed and carry on.
      const seeded = buildSeed();
      this.write(seeded, false);
      return seeded;
    }
  }

  private write(db: Database, notify = true) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    if (notify) {
      this.channel?.postMessage('changed');
      this.emit();
    }
  }

  async load(): Promise<Database> {
    return this.read();
  }

  subscribe(onChange: () => void) {
    this.listeners.add(onChange);
    return () => {
      this.listeners.delete(onChange);
    };
  }

  async insert<T extends TableName>(table: T, rows: Row<T>[]) {
    const db = this.read();
    (db[table] as Row<T>[]).push(...rows);
    this.write(db);
  }

  async update<T extends TableName>(table: T, key: string, patch: Partial<Row<T>>) {
    const db = this.read();
    const pk = PRIMARY_KEY[table];
    const list = db[table] as unknown as Record<string, unknown>[];
    const idx = list.findIndex((row) => row[pk] === key);
    if (idx === -1) return;
    list[idx] = { ...list[idx], ...(patch as Record<string, unknown>) };
    this.write(db);
  }

  async remove<T extends TableName>(table: T, key: string) {
    const db = this.read();
    const pk = PRIMARY_KEY[table];
    const list = db[table] as unknown as Record<string, unknown>[];
    const idx = list.findIndex((row) => row[pk] === key);
    if (idx === -1) return;
    list.splice(idx, 1);
    this.write(db);
  }

  async reset() {
    this.write(buildSeed());
  }
}
