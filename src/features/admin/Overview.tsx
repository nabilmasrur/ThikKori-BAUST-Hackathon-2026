import { Link } from 'react-router-dom';
import { Badge, Card, SectionTitle, Stat } from '@/components/ui';
import { IconAlert, IconChart, IconInbox, IconTaka, IconUsers, IconWrench } from '@/components/Icons';
import { STATUS_TONE } from '@/features/customer/statusTone';
import { platformMetrics } from '@/features/admin/metrics';
import { useData } from '@/state/DataContext';
import { useFmt } from '@/lib/useFmt';
import { categoryName, shortRef } from '@/lib/labels';

export function Overview() {
  const { db } = useData();
  const { t, locale, taka, num, pct, digits, dateTime } = useFmt();
  if (!db) return null;

  const m = platformMetrics(db);
  const latest = [...db.bookings].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-[26px]">{t('admin.overviewTitle')}</h1>
        {m.openIssues > 0 && (
          <Link to="/admin/issues">
            <Badge tone="brick">
              <IconAlert size={13} />
              {num(m.openIssues)} {t('nav.issues')}
            </Badge>
          </Link>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label={t('admin.requestsToday')} value={num(m.requestsToday)} icon={<IconInbox size={18} />} />
        <Stat label={t('admin.activeBookings')} value={num(m.activeBookings)} />
        <Stat label={t('admin.pendingRequests')} value={num(m.pendingRequests)} />
        <Stat label={t('admin.providersOnline')} value={num(m.providersOnline)} icon={<IconWrench size={18} />} tone="sage" />
        <Stat label={t('admin.customersRegistered')} value={num(m.customers)} icon={<IconUsers size={18} />} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label={t('admin.revenue')}
          value={taka(m.revenue)}
          hint={t('admin.revenueDesc')}
          tone="sage"
          icon={<IconTaka size={18} />}
        />
        <Stat label={t('admin.avgMatch')} value={pct(m.avgMatchScore)} icon={<IconChart size={18} />} />
        <Stat
          label={t('admin.avgCompletion')}
          value={t('admin.hours', { value: digits(m.avgCompletionHours.toFixed(1)) })}
        />
      </div>

      <section>
        <SectionTitle
          title={t('admin.monitorTitle')}
          action={
            <Link to="/admin/monitor" className="text-[13px] font-semibold text-teal hover:underline">
              {t('common.view')}
            </Link>
          }
        />
        <Card className="divide-y divide-stone-line">
          {latest.map((b) => {
            const req = db.requests.find((r) => r.id === b.request_id);
            const cat = db.service_categories.find((c) => c.id === req?.service_category_id);
            const prov = db.providers.find((p) => p.id === b.provider_id);
            return (
              <div key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-[13px]">
                <span className="num w-[70px] shrink-0 text-ink-faint">{shortRef(b.id)}</span>
                <span className="min-w-0 flex-1 truncate font-semibold">{categoryName(cat, locale)}</span>
                <span className="hidden min-w-0 flex-1 truncate text-ink-soft sm:block">{prov?.business_name}</span>
                <span className="num shrink-0 text-ink-faint">{dateTime(b.created_at)}</span>
                <Badge tone={STATUS_TONE[b.status]}>{t(`status.${b.status}`)}</Badge>
              </div>
            );
          })}
        </Card>
      </section>

      <section>
        <SectionTitle title="Customer Reviews" />
        {db.reviews.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {db.reviews.map(r => {
              const c = db.customers.find(c => c.id === r.customer_id);
              const p = db.providers.find(p => p.id === r.provider_id);
              return (
                <Card key={r.id} className="p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-[14px]">{c?.name || 'Unknown'}</div>
                      <div className="text-[12px] text-ink-soft">to {p?.name || 'Unknown'}</div>
                    </div>
                    <Badge tone={r.rating >= 4 ? 'sage' : r.rating <= 2 ? 'brick' : 'amber'}>{r.rating} / 5</Badge>
                  </div>
                  <p className="text-[13px] text-ink italic">"{r.comment}"</p>
                  <div className="mt-auto text-[11px] text-ink-faint pt-2">{dateTime(r.created_at)}</div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-4 text-[13.5px] text-ink-soft">No reviews submitted yet.</Card>
        )}
      </section>
    </div>
  );
}
