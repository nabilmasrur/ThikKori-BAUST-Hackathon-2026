import { BOOKING_FLOW } from '@/lib/constants';
import { useFmt } from '@/lib/useFmt';
import { cn } from '@/lib/cn';
import { IconCheck } from '@/components/Icons';
import type { BookingStatus, StatusHistoryEntry } from '@/types';

/**
 * The live tracking spine. Colour carries the information: teal for done,
 * amber for the step happening now, stone for what has not happened yet.
 */
export function StatusTimeline({
  status,
  history,
}: {
  status: BookingStatus;
  history: StatusHistoryEntry[];
}) {
  const { t, dateTime } = useFmt();

  if (status === 'cancelled') {
    const at = history.find((h) => h.status === 'cancelled');
    return (
      <div className="rounded-lg border border-brick/25 bg-brick-wash p-4">
        <p className="font-display text-[15px] text-brick">{t('status.cancelled')}</p>
        <p className="mt-1 text-[13px] text-ink-soft">{at?.note || t('statusHint.cancelled')}</p>
      </div>
    );
  }

  const currentIndex = BOOKING_FLOW.indexOf(status as (typeof BOOKING_FLOW)[number]);

  return (
    <ol className="relative">
      {BOOKING_FLOW.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const entry = history.find((h) => h.status === step);
        return (
          <li key={step} className="relative flex gap-3 pb-5 last:pb-0">
            {i < BOOKING_FLOW.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5',
                  done ? 'bg-teal' : 'bg-stone-line',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold',
                done && 'border-teal bg-teal text-stone-base',
                active && 'border-amber bg-amber text-ink',
                !done && !active && 'border-stone-line bg-stone-raised text-ink-faint',
              )}
            >
              {done ? <IconCheck size={14} /> : i + 1}
            </span>
            <div className="pt-0.5">
              <p
                className={cn(
                  'text-[15px] font-semibold',
                  active ? 'text-ink' : done ? 'text-teal' : 'text-ink-faint',
                )}
              >
                {t(`status.${step}`)}
              </p>
              <p className="text-[12.5px] text-ink-soft">
                {entry ? dateTime(entry.created_at) : active ? t('statusHint.' + step) : t('tracking.waiting')}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
