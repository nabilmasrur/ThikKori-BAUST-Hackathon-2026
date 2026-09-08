import { Card, ProgressBar, SectionTitle, Stat } from '@/components/ui';
import { IconGift } from '@/components/Icons';
import { LOYALTY_THRESHOLDS } from '@/lib/constants';
import { useData } from '@/state/DataContext';
import { useFmt } from '@/lib/useFmt';
import type { Customer } from '@/types';

export function Rewards({ customer }: { customer: Customer }) {
  const { db } = useData();
  const { t, num, taka } = useFmt();
  if (!db) return null;

  const loyalty = db.loyalty.find((l) => l.customer_id === customer.id) ?? {
    customer_id: customer.id,
    points: 0,
    rated_bookings: 0,
    coupons_unlocked: [] as string[],
  };

  const next = LOYALTY_THRESHOLDS.find((th) => loyalty.rated_bookings < th.rated);
  const remaining = next ? next.rated - loyalty.rated_bookings : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-[24px]">{t('loyalty.title')}</h1>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label={t('loyalty.points')} value={num(loyalty.points)} icon={<IconGift size={18} />} />
        <Stat label={t('loyalty.rated')} value={num(loyalty.rated_bookings)} />
        <Stat label={t('home.trust')} value={num(customer.trust_score)} tone="sage" />
      </div>

      {next && (
        <Card className="mt-4 p-5">
          <p className="text-[13.5px] font-semibold">{t('loyalty.nextAt', { n: num(next.rated) })}</p>
          <div className="mt-3">
            <ProgressBar value={loyalty.rated_bookings} max={next.rated} tone="amber" />
          </div>
          <p className="mt-2 text-[12.5px] text-ink-soft">{t('loyalty.noCoupons', { n: num(remaining) })}</p>
        </Card>
      )}

      <div className="mt-6">
        <SectionTitle title={t('loyalty.coupons')} />
        <div className="grid gap-2 sm:grid-cols-2">
          {LOYALTY_THRESHOLDS.map((th) => {
            const owned = loyalty.coupons_unlocked.includes(th.coupon);
            return (
              <Card
                key={th.coupon}
                className={`flex items-center gap-3 p-4 ${owned ? 'border-sage/40 bg-sage-wash' : 'opacity-70'}`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    owned ? 'bg-sage text-stone-base' : 'bg-stone-deep text-ink-faint'
                  }`}
                >
                  <IconGift size={20} />
                </span>
                <div className="min-w-0">
                  <p className="num font-mono text-[15px] font-semibold tracking-wider">{th.coupon}</p>
                  <p className="text-[12.5px] text-ink-soft">{t('loyalty.discount', { value: taka(th.discount) })}</p>
                </div>
                <span className="num ml-auto text-[12px] text-ink-faint">{num(th.rated)}★</span>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
