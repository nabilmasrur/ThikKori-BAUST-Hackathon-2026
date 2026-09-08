import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

// ── Button ───────────────────────────────────────────────────────────

type Variant = 'primary' | 'accent' | 'ghost' | 'outline' | 'danger' | 'quiet';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-teal text-stone-base hover:bg-teal-deep disabled:bg-teal/40',
  accent: 'bg-amber text-ink hover:bg-amber-deep hover:text-stone-base disabled:bg-amber/40',
  outline: 'border border-teal/30 text-teal hover:bg-teal-wash',
  ghost: 'text-ink-soft hover:bg-stone-deep',
  danger: 'border border-brick/30 text-brick hover:bg-brick-wash',
  quiet: 'bg-stone-deep text-ink hover:bg-stone-line',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  full,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; full?: boolean }) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        full && 'w-full',
        className,
      )}
    />
  );
}

// ── Surfaces ─────────────────────────────────────────────────────────

export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  return <Tag className={cn('surface rounded-xl', className)}>{children}</Tag>;
}

export function SectionTitle({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-3">
      <div>
        <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
        {hint && <p className="text-[13px] text-ink-soft mt-0.5">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────────────

type Tone = 'teal' | 'amber' | 'sage' | 'brick' | 'neutral';

const TONES: Record<Tone, string> = {
  teal: 'bg-teal-wash text-teal border-teal/20',
  amber: 'bg-amber-wash text-amber-deep border-amber/25',
  sage: 'bg-sage-wash text-sage border-sage/20',
  brick: 'bg-brick-wash text-brick border-brick/20',
  neutral: 'bg-stone-deep text-ink-soft border-stone-line',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[12px] font-semibold',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ── Form fields ──────────────────────────────────────────────────────

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="label-field">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-[12px] font-medium text-brick">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[12px] text-ink-faint">{hint}</span>
      ) : null}
    </label>
  );
}

const CONTROL =
  'w-full rounded-lg border border-stone-line bg-stone-raised px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(CONTROL, 'h-10', className)} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(CONTROL, 'min-h-[96px] resize-y', className)} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(CONTROL, 'h-10 pr-8', className)} />;
}

// ── Progress ─────────────────────────────────────────────────────────

export function ProgressBar({
  value,
  max,
  tone = 'teal',
  label,
}: {
  value: number;
  max: number;
  tone?: 'teal' | 'amber' | 'sage';
  label?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const fill = tone === 'amber' ? 'bg-amber' : tone === 'sage' ? 'bg-sage' : 'bg-teal';
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-stone-deep"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500', fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Stat tile ────────────────────────────────────────────────────────

export function Stat({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'sage' | 'brick' | 'teal';
  icon?: ReactNode;
}) {
  const color = tone === 'sage' ? 'text-sage' : tone === 'brick' ? 'text-brick' : 'text-ink';
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[12px] font-semibold uppercase-none tracking-normal text-ink-soft">{label}</span>
        {icon && <span className="text-teal/60">{icon}</span>}
      </div>
      <div className={cn('mt-2 font-display text-[26px] leading-none num', color)}>{value}</div>
      {hint && <p className="mt-1.5 text-[12px] text-ink-faint">{hint}</p>}
    </Card>
  );
}

// ── Empty state ──────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      {icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-wash text-teal">
          {icon}
        </span>
      )}
      <h3 className="font-display text-[18px] text-ink">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-soft">{description}</p>}
      {action}
    </Card>
  );
}

// ── Modal ────────────────────────────────────────────────────────────

const ModalCtx = createContext<() => void>(() => {});
export const useCloseModal = () => useContext(ModalCtx);

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector<HTMLElement>('input,select,textarea,button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={ref}
        className="w-full max-w-lg animate-rise rounded-t-2xl border border-stone-line bg-stone-raised shadow-lift sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-stone-line px-5 py-3.5">
          <h2 id={titleId} className="font-display text-[17px]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1 text-ink-faint hover:bg-stone-deep hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <ModalCtx.Provider value={onClose}>
          <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        </ModalCtx.Provider>
        {footer && <div className="flex justify-end gap-2 border-t border-stone-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

// ── Table ────────────────────────────────────────────────────────────

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-stone-line text-left">
            {head.map((h, i) => (
              <th key={i} className="px-3 py-2 text-[12px] font-semibold text-ink-soft">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="border-b border-stone-line/70 last:border-0 hover:bg-stone-base/60">{children}</tr>;
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn('px-3 py-2.5 align-middle', className)}>{children}</td>;
}

// ── Spinner ──────────────────────────────────────────────────────────

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-soft" role="status">
      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#DEDCD3" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="#1D4B4A" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {label}
    </div>
  );
}

// ── Segmented control ────────────────────────────────────────────────

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-stone-line bg-stone-raised p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            'rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition-colors',
            value === o.value ? 'bg-teal text-stone-base' : 'text-ink-soft hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
