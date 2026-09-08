import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Button, Card, Modal, SectionTitle } from '@/components/ui';
import { StatusTimeline } from '@/components/StatusTimeline';
import { IconPhone, IconQr } from '@/components/Icons';
import { PaymentQR } from '@/features/provider/PaymentQR';
import { STATUS_TONE } from '@/features/customer/statusTone';
import { NotFound } from '@/features/errors/NotFound';
import { NEXT_STATUS, advanceBooking } from '@/data/operations';
import { useData } from '@/state/DataContext';
import { useToast } from '@/state/ToastContext';
import { useFmt } from '@/lib/useFmt';
import { areaName, categoryName, shortRef } from '@/lib/labels';
import type { Provider } from '@/types';

export function JobDetail({ provider }: { provider: Provider }) {
  const { bookingId } = useParams();
  const { db, adapter } = useData();
  const { push } = useToast();
  const { t, locale, taka, date, slot } = useFmt();
  const [qrOpen, setQrOpen] = useState(false);

  if (!db) return null;
  const booking = db.bookings.find((b) => b.id === bookingId && b.provider_id === provider.id);
  if (!booking) return <NotFound />;

  const request = db.requests.find((r) => r.id === booking.request_id);
  const category = db.service_categories.find((c) => c.id === request?.service_category_id);
  const customer = db.customers.find((c) => c.id === booking.customer_id);
  const invoice = db.invoices.find((i) => i.booking_id === booking.id);
  const history = db.status_history
    .filter((h) => h.booking_id === booking.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const next = NEXT_STATUS[booking.status];

  const advance = async () => {
    if (!next) return;
    await advanceBooking(adapter, db, booking, next);
    push(t('toast.statusUpdated', { status: t(`status.${next}`) }), 'success');
    if (next === 'in_progress') push(t('toast.invoiceReady'));
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px]">{categoryName(category, locale)}</h1>
          <p className="num mt-1 text-[13px] text-ink-faint">{shortRef(booking.id)}</p>
        </div>
        <Badge tone={STATUS_TONE[booking.status]}>{t(`status.${booking.status}`)}</Badge>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr]">
        <Card className="p-5">
          <SectionTitle title={t('provider.customer')} />
          <p className="font-display text-[18px]">{customer?.name}</p>
          <p className="text-[13.5px] text-ink-soft">
            {request?.address}, {request ? areaName(request.area, locale) : ''}
          </p>
          <p className="num mt-2 text-[13.5px]">
            {date(booking.confirmed_date)} · {slot(booking.confirmed_slot)}
          </p>
          <p className="num mt-2 font-display text-[24px]">{taka(booking.agreed_price)}</p>
          {customer && (
            <a href={`tel:${customer.phone}`} className="mt-3 inline-block">
              <Button variant="outline" size="sm">
                <IconPhone size={15} />
                {customer.phone}
              </Button>
            </a>
          )}
          {request?.problem_description && (
            <p className="mt-3 rounded-lg bg-stone-base/70 p-3 text-[13px] leading-snug text-ink-soft">
              {request.problem_description}
            </p>
          )}
          {request?.image_url && (
            <img src={request.image_url} alt="" className="mt-3 w-full rounded-lg border border-stone-line" />
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle title={t('tracking.timeline')} />
          <StatusTimeline status={booking.status} history={history} />
        </Card>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {next && (
          <Button variant="accent" size="lg" onClick={() => void advance()}>
            {booking.status === 'requested'
              ? t('provider.accept')
              : booking.status === 'accepted'
                ? t('provider.start')
                : t('provider.arrive')}
          </Button>
        )}
        {invoice && (
          <Button
            variant={invoice.payment_status === 'pending' ? 'primary' : 'quiet'}
            size="lg"
            onClick={() => setQrOpen(true)}
          >
            <IconQr size={18} />
            {invoice.payment_status === 'pending' ? t('provider.showQr') : t('invoice.receipt')}
          </Button>
        )}
      </div>

      {invoice?.payment_status === 'pending' && (
        <p className="mt-3 text-[13px] text-ink-soft">{t('provider.waitingPayment')}</p>
      )}

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title={t('provider.qrTitle')}>
        {invoice && <PaymentQR invoice={invoice} />}
      </Modal>
    </div>
  );
}
