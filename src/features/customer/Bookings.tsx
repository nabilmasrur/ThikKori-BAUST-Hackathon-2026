import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Button, Card, EmptyState, Segmented } from '@/components/ui';
import { CategoryIcon, IconChevron, IconInbox } from '@/components/Icons';
import { STATUS_TONE } from '@/features/customer/statusTone';
import { useData } from '@/state/DataContext';
import { useFmt } from '@/lib/useFmt';
import { categoryName, shortRef } from '@/lib/labels';
import type { Customer } from '@/types';

export function MyBookings({ customer }: { customer: Customer }) {
  const { db } = useData();
  const { t, locale, taka, date, slot } = useFmt();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'active' | 'past'>('active');
  if (!db) return null;

  const all = db.bookings
    .filter((b) => b.customer_id === customer.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const rows = all.filter((b) =>
    tab === 'active'
      ? b.status !== 'completed' && b.status !== 'cancelled'
      : b.status === 'completed' || b.status === 'cancelled',
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[24px]">{t('bookings.title')}</h1>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'active', label: t('bookings.active') },
            { value: 'past', label: t('bookings.past') },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<IconInbox size={22} />}
            title={t('bookings.empty')}
            description={t('bookings.emptyDesc')}
            action={
              <Button variant="accent" onClick={() => navigate('/customer/new')}>
                {t('bookings.start')}
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-2">
          {rows.map((b) => {
            const req = db.requests.find((r) => r.id === b.request_id);
            const cat = db.service_categories.find((c) => c.id === req?.service_category_id);
            const provider = db.providers.find((p) => p.id === b.provider_id);
            return (
              <Link key={b.id} to={`/customer/booking/${b.id}`}>
                <Card className="flex items-center gap-3.5 p-4 transition-colors hover:border-teal/40">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-wash text-teal">
                    <CategoryIcon name={cat?.icon ?? ''} size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-semibold">{categoryName(cat, locale)}</p>
                    <p className="num truncate text-[12.5px] text-ink-soft">
                      {provider?.business_name} · {date(b.confirmed_date)} · {slot(b.confirmed_slot)}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="num text-[13.5px] font-semibold">{taka(b.agreed_price)}</p>
                    <p className="num text-[11px] text-ink-faint">{shortRef(b.id)}</p>
                  </div>
                  <Badge tone={STATUS_TONE[b.status]}>{t(`status.${b.status}`)}</Badge>
                  <IconChevron size={18} className="shrink-0 text-ink-faint" />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
