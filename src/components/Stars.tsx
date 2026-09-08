import { IconStar } from '@/components/Icons';
import { useFmt } from '@/lib/useFmt';
import { cn } from '@/lib/cn';

export function Stars({ value, size = 15 }: { value: number; size?: number }) {
  const { digits } = useFmt();
  return (
    <span className="inline-flex items-center gap-1 text-amber">
      <IconStar filled size={size} />
      <span className="num text-[13px] font-semibold text-ink">{digits(value.toFixed(1))}</span>
    </span>
  );
}

export function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const { t } = useFmt();
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={t('a11y.star', { n })}
          aria-pressed={value === n}
          className={cn(
            'rounded-lg p-1.5 transition-colors',
            n <= value ? 'text-amber' : 'text-stone-line hover:text-amber/50',
          )}
        >
          <IconStar filled={n <= value} size={30} />
        </button>
      ))}
    </div>
  );
}
