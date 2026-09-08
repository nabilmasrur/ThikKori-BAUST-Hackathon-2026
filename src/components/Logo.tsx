import { cn } from '@/lib/cn';

/**
 * The mark is a check drawn like a tick on a job sheet — "ঠিক করি",
 * ThikKori: I'll fix it. Wordmark stays Latin in both locales so the
 * brand reads the same on a van, a receipt and a browser tab.
 */
export function Logo({
  size = 'md',
  onDark = false,
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  onDark?: boolean;
  className?: string;
}) {
  const box = size === 'lg' ? 44 : size === 'sm' ? 26 : 32;
  const text = size === 'lg' ? 'text-[30px]' : size === 'sm' ? 'text-[17px]' : 'text-[21px]';
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg width={box} height={box} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
        <rect width="64" height="64" rx="15" fill={onDark ? '#F2F1EC' : '#1D4B4A'} />
        <path
          d="M17 34.5 27 44 47 21"
          fill="none"
          stroke="#D98C2B"
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={cn(
          'font-display font-semibold tracking-[-0.02em]',
          text,
          onDark ? 'text-stone-base' : 'text-ink',
        )}
      >
        Thik<span className={onDark ? 'text-amber' : 'text-teal'}>Kori</span>
      </span>
    </span>
  );
}
