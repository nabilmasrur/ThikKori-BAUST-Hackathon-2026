import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { DataAdapter } from '@/data/adapter';
import { getAdapter } from '@/data';
import type { Database } from '@/types';

interface DataValue {
  db: Database | null;
  adapter: DataAdapter;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const Ctx = createContext<DataValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const adapter = useMemo(() => getAdapter(), []);
  const [db, setDb] = useState<Database | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const pending = useRef(false);

  const refresh = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    try {
      const next = await adapter.load();
      setDb(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }, [adapter]);

  useEffect(() => {
    void refresh();
    // Realtime: any write anywhere re-pulls the snapshot. Coalesced so a
    // burst of related writes costs one round trip.
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = adapter.subscribe(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void refresh(), 90);
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [adapter, refresh]);

  const value = useMemo<DataValue>(
    () => ({ db, adapter, loading, error, refresh }),
    [db, adapter, loading, error, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData(): DataValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useData must be used inside <DataProvider>');
  return v;
}

/** Convenience for screens that only render once data exists. */
export function useDb(): Database {
  const { db } = useData();
  if (!db) throw new Error('Database snapshot is not ready yet');
  return db;
}
