import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Toast {
  id: string;
  text: string;
  tone: 'info' | 'success' | 'alert';
  at: number;
}

interface ToastValue {
  toasts: Toast[];
  push: (text: string, tone?: Toast['tone']) => void;
  dismiss: (id: string) => void;
}

const Ctx = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (text: string, tone: Toast['tone'] = 'info') => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-3), { id, text, tone, at: Date.now() }]);
      setTimeout(() => dismiss(id), 5200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <ToastStack />
    </Ctx.Provider>
  );
}

export function useToast(): ToastValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useToast must be used inside <ToastProvider>');
  return v;
}

/**
 * Notifications read like the SMS and WhatsApp messages these customers
 * actually get from service businesses — a green bubble with a timestamp.
 */
function ToastStack() {
  const { toasts, dismiss } = useToast();
  if (!toasts.length) return null;
  return (
    <div
      className="no-print pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismiss(t.id)}
          className={cn(
            'pointer-events-auto max-w-sm animate-rise rounded-2xl rounded-br-sm px-4 py-2.5 text-left text-[13px] shadow-lift',
            t.tone === 'alert'
              ? 'bg-brick text-stone-base'
              : t.tone === 'success'
                ? 'bg-sage text-stone-base'
                : 'bg-teal text-stone-base',
          )}
        >
          <span className="block leading-snug">{t.text}</span>
          <span className="mt-1 block text-right font-mono text-[10px] opacity-70">
            {new Date(t.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </button>
      ))}
    </div>
  );
}
