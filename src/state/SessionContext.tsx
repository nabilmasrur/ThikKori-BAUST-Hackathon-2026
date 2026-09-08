import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { applyLocale, persistLocale, storedLocale } from '@/i18n';
import type { Locale } from '@/types';

export type Role = 'customer' | 'provider' | 'admin';

interface StoredSession {
  role: Role;
  id: string;
}

const SESSION_KEY = 'thikkori.session.v1';

/**
 * Who is signed in lives in sessionStorage, not localStorage, so one laptop
 * can run the customer app in one tab and the provider dashboard in another —
 * the two-screen demo. The data itself stays shared in localStorage, and the
 * language choice stays in localStorage too, since it is a device preference.
 */
function readSession(): StoredSession | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

interface SessionValue {
  locale: Locale;
  localeChosen: boolean;
  setLocale: (l: Locale) => void;
  session: StoredSession | null;
  signIn: (role: Role, id: string, preferred?: Locale) => void;
  signOut: () => void;
}

const Ctx = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(storedLocale() ?? 'en');
  const [localeChosen, setLocaleChosen] = useState<boolean>(storedLocale() !== null);
  const [session, setSession] = useState<StoredSession | null>(readSession);

  const setLocale = useCallback((l: Locale) => {
    persistLocale(l);
    setLocaleState(l);
    setLocaleChosen(true);
  }, []);

  const signIn = useCallback(
    (role: Role, id: string, preferred?: Locale) => {
      const next = { role, id };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      setSession(next);
      // A signed-in account carries its own language preference, so the
      // right language loads without asking again.
      if (preferred && preferred !== locale) {
        persistLocale(preferred);
        setLocaleState(preferred);
      } else {
        applyLocale(locale);
      }
    },
    [locale],
  );

  const signOut = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({ locale, localeChosen, setLocale, session, signIn, signOut }),
    [locale, localeChosen, setLocale, session, signIn, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession must be used inside <SessionProvider>');
  return v;
}
