import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, EmptyState, Field, Modal, SectionTitle, Stat, Textarea } from '@/components/ui';
import { CategoryIcon, IconInbox, IconQr, IconStar, IconTaka, IconWrench } from '@/components/Icons';
import { PaymentQR } from '@/features/provider/PaymentQR';
import { STATUS_TONE } from '@/features/customer/statusTone';
import { NEXT_STATUS, advanceBooking, rejectBooking } from '@/data/operations';
import { useData } from '@/state/DataContext';
import { useToast } from '@/state/ToastContext';
import { useFmt } from '@/lib/useFmt';
import { areaName, categoryName, shortRef } from '@/lib/labels';
import { monthKey } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Booking, Provider } from '@/types';

export function ProviderDashboard({ provider }: { provider: Provider }) {
  const { db, adapter } = useData();
  const { push } = useToast();
  const { t, locale, taka, num, date, slot, digits } = useFmt();
  const [qrFor, setQrFor] = useState<string | null>(null);
  const [rejectFor, setRejectFor] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  if (!db) return null;

  const jobs = db.bookings
    .filter((b) => b.provider_id === provider.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const incoming = jobs.filter((b) => b.status === 'requested');
  const scheduled = jobs.filter((b) => ['accepted', 'on_the_way', 'in_progress'].includes(b.status));
  const recent = jobs.filter((b) => b.status === 'completed').slice(0, 4);

  const thisMonth = monthKey(new Date().toISOString());
  const earnedThisMonth = db.invoices
    .filter((i) => i.provider_id === provider.id && i.payment_status === 'paid' && monthKey(i.paid_at ?? '') === thisMonth)
    .reduce((s, i) => s + i.subtotal, 0);

  const setOnline = async (online: boolean) => {
    await adapter.update('providers', provider.id, { is_online: online });
  };

  const advance = async (booking: Booking) => {
    const to = NEXT_STATUS[booking.status];
    if (!to) return;
    await advanceBooking(adapter, db, booking, to);
    push(t('toast.statusUpdated', { status: t(`status.${to}`) }), 'success');
    if (to === 'in_progress') push(t('toast.invoiceReady'));
  };

  const doReject = async () => {
    if (!rejectFor) return;
    await rejectBooking(adapter, rejectFor, rejectReason.trim() || '—');
    setRejectFor(null);
    setRejectReason('');
    push(t('toast.rejected'), 'alert');
  };

  const invoiceOf = (bookingId: string) => db.invoices.find((i) => i.booking_id === bookingId);

  const JobCard = ({ booking, primary }: { booking: Booking; primary?: boolean }) => {
    const req = db.requests.find((r) => r.id === booking.request_id);
    const cat = db.service_categories.find((c) => c.id === req?.service_category_id);
    const cust = db.customers.find((c) => c.id === booking.customer_id);
    const invoice = invoiceOf(booking.id);
    const next = NEXT_STATUS[booking.status];

    return (
      <Card className={cn('p-4', primary && 'border-amber/40')}>
        <div className="flex items-start gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-wash text-teal">
            <CategoryIcon name={cat?.icon ?? ''} size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[16px] font-semibold">{categoryName(cat, locale)}</h3>
              <Badge tone={STATUS_TONE[booking.status]}>{t(`status.${booking.status}`)}</Badge>
              {req?.urgency !== 'normal' && <Badge tone="brick">{t(`urgency.${req?.urgency ?? 'normal'}`)}</Badge>}
            </div>
            <p className="num mt-1 text-[13px] text-ink-soft">
              {date(booking.confirmed_date)} · {slot(booking.confirmed_slot)}
            </p>
            <p className="mt-0.5 truncate text-[13px] text-ink-soft">
              {cust?.name} · {req ? areaName(req.area, locale) : ''}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="num font-display text-[20px] leading-none">{taka(booking.agreed_price)}</p>
            <p className="num mt-1 text-[11px] text-ink-faint">{shortRef(booking.id)}</p>
          </div>
        </div>

        {req?.problem_description && (
          <p className="mt-3 rounded-lg bg-stone-base/70 p-3 text-[13px] leading-snug text-ink-soft">
            {req.problem_description}
          </p>
        )}

        <div className="mt-3.5 flex flex-wrap gap-2">
          {booking.status === 'requested' ? (
            <>
              <Button variant="accent" size="lg" onClick={() => void advance(booking)}>
                {t('provider.accept')}
              </Button>
              <Button variant="danger" size="lg" onClick={() => setRejectFor(booking)}>
                {t('provider.reject')}
              </Button>
            </>
          ) : next ? (
            <Button variant="accent" size="lg" onClick={() => void advance(booking)}>
              {booking.status === 'accepted' ? t('provider.start') : t('provider.arrive')}
            </Button>
          ) : null}

          {booking.status === 'in_progress' && invoice && invoice.payment_status === 'pending' && (
            <Button variant="primary" size="lg" onClick={() => setQrFor(invoice.id)}>
              <IconQr size={18} />
              {t('provider.showQr')}
            </Button>
          )}

          <Link to={`/provider/job/${booking.id}`}>
            <Button variant="ghost" size="lg">
              {t('provider.viewJob')}
            </Button>
          </Link>
        </div>
      </Card>
    );
  };

  const shownInvoice = db.invoices.find((i) => i.id === qrFor);

  return (
    <div className="grid gap-7">
      {/* Identity strip: big, icon-forward, low reading load. */}
      <Card className="flex flex-wrap items-center gap-4 p-5">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal text-stone-base">
          <IconWrench size={26} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[22px] leading-tight">{provider.business_name}</h1>
          <p className="text-[13.5px] text-ink-soft">
            {t('provider.greeting', { name: provider.name.split(' ')[0] })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void setOnline(!provider.is_online)}
          aria-pressed={provider.is_online}
          className={cn(
            'flex items-center gap-2 rounded-full border px-4 py-2 text-[13.5px] font-semibold transition-colors',
            provider.is_online
              ? 'border-sage/40 bg-sage-wash text-sage'
              : 'border-stone-line bg-stone-deep text-ink-soft',
          )}
        >
          <span className={cn('h-2 w-2 rounded-full', provider.is_online ? 'bg-sage' : 'bg-ink-faint')} />
          {provider.is_online ? t('provider.online') : t('provider.offline')}
        </button>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label={t('finances.earnedMonth')}
          value={taka(earnedThisMonth)}
          icon={<IconTaka size={18} />}
          tone="sage"
        />
        <Stat label={t('provider.rating')} value={digits(provider.rating.toFixed(1))} icon={<IconStar filled size={18} />} />
        <Stat label={t('provider.jobsDone')} value={num(provider.completed_jobs_count)} />
      </div>

      <section>
        <SectionTitle title={t('provider.incoming')} hint={t('provider.incomingDesc')} />
        {incoming.length ? (
          <div className="grid gap-3">
            {incoming.map((b) => (
              <JobCard key={b.id} booking={b} primary />
            ))}
          </div>
        ) : (
          <Card className="p-4 text-[13.5px] text-ink-soft">{t('provider.noJobs')}</Card>
        )}
      </section>

      <section>
        <SectionTitle title={t('provider.todayJobs')} />
        {scheduled.length ? (
          <div className="grid gap-3">
            {scheduled.map((b) => (
              <JobCard key={b.id} booking={b} />
            ))}
          </div>
        ) : incoming.length === 0 && recent.length === 0 ? (
          <EmptyState
            icon={<IconInbox size={22} />}
            title={t('provider.noJobs')}
            description={t('provider.noJobsDesc')}
            action={
              !provider.is_online ? (
                <Button variant="accent" onClick={() => void setOnline(true)}>
                  {t('provider.goOnline')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Card className="p-4 text-[13.5px] text-ink-soft">{t('home.activeNone')}</Card>
        )}
      </section>

      <section>
        <SectionTitle title={t('provider.completed')} />
        {recent.length > 0 ? (
          <div className="grid gap-2">
            {recent.map((b) => {
              const req = db.requests.find((r) => r.id === b.request_id);
              const cat = db.service_categories.find((c) => c.id === req?.service_category_id);
              return (
                <Card key={b.id} className="flex items-center gap-3 p-3.5">
                  <CategoryIcon name={cat?.icon ?? ''} size={20} className="shrink-0 text-ink-faint" />
                  <span className="min-w-0 flex-1 truncate text-[14px]">{categoryName(cat, locale)}</span>
                  <span className="num shrink-0 text-[12.5px] text-ink-faint">{date(b.confirmed_date)}</span>
                  <span className="num shrink-0 text-[14px] font-semibold text-sage">{taka(b.agreed_price)}</span>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-4 text-[13.5px] text-ink-soft">
            You don't have any recent past jobs.
          </Card>
        )}
      </section>

      <Modal open={Boolean(shownInvoice)} onClose={() => setQrFor(null)} title={t('provider.qrTitle')}>
        {shownInvoice && <PaymentQR invoice={shownInvoice} />}
      </Modal>

      <Modal
        open={Boolean(rejectFor)}
        onClose={() => setRejectFor(null)}
        title={t('provider.rejectReason')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectFor(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={() => void doReject()}>
              {t('provider.reject')}
            </Button>
          </>
        }
      >
        <Field label={t('common.reason')}>
          <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
        </Field>
      </Modal>
    </div>
  );
}
