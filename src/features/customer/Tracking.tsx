import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Card, Field, Modal, SectionTitle, Textarea } from '@/components/ui';
import { StatusTimeline } from '@/components/StatusTimeline';
import { StarPicker, Stars } from '@/components/Stars';
import { IconPhone, IconQr } from '@/components/Icons';
import { NotFound } from '@/features/errors/NotFound';
import { STATUS_TONE } from '@/features/customer/statusTone';
import { reportIssue, submitReview } from '@/data/operations';
import { useData } from '@/state/DataContext';
import { useToast } from '@/state/ToastContext';
import { useFmt } from '@/lib/useFmt';
import { areaName, categoryName, shortRef } from '@/lib/labels';
import type { Customer } from '@/types';

export function Tracking({ customer }: { customer: Customer }) {
  const { bookingId } = useParams();
  const { db, adapter } = useData();
  const { push } = useToast();
  const { t, locale, taka, date, slot } = useFmt();

  const [rateOpen, setRateOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');

  if (!db) return null;
  const booking = db.bookings.find((b) => b.id === bookingId && b.customer_id === customer.id);
  if (!booking) return <NotFound />;

  const request = db.requests.find((r) => r.id === booking.request_id);
  const category = db.service_categories.find((c) => c.id === request?.service_category_id);
  const provider = db.providers.find((p) => p.id === booking.provider_id);
  const invoice = db.invoices.find((i) => i.booking_id === booking.id);
  const history = db.status_history
    .filter((h) => h.booking_id === booking.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const review = db.reviews.find((r) => r.booking_id === booking.id);

  const sendReview = async () => {
    const unlocked = await submitReview(adapter, db, { booking, rating, comment: comment.trim() });
    setRateOpen(false);
    push(t('toast.reviewed'), 'success');
    for (const code of unlocked) push(t('rate.unlocked', { code }), 'success');
  };

  const sendReport = async () => {
    if (!reportText.trim()) return;
    await reportIssue(adapter, {
      booking_id: booking.id,
      reported_by_customer_id: customer.id,
      reason: reportText.trim(),
    });
    setReportOpen(false);
    setReportText('');
    push(t('tracking.reportSent'), 'alert');
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px]">{t('tracking.title')}</h1>
          <p className="num mt-1 text-[13px] text-ink-faint">
            {t('tracking.reference', { id: shortRef(booking.id) })}
          </p>
        </div>
        <Badge tone={STATUS_TONE[booking.status]}>{t(`status.${booking.status}`)}</Badge>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr_1fr]">
        <Card className="p-5">
          <SectionTitle title={t('tracking.timeline')} />
          <StatusTimeline status={booking.status} history={history} />
        </Card>

        <div className="grid content-start gap-4">
          <Card className="p-5">
            <p className="text-[12px] font-semibold text-ink-soft">{t('tracking.provider')}</p>
            {provider && (
              <>
                <p className="mt-1 font-display text-[18px]">{provider.business_name}</p>
                <p className="text-[13px] text-ink-soft">
                  {provider.name} · {areaName(provider.base_area, locale)}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <Stars value={provider.rating} />
                  <Badge tone="amber">{t(`tier.${provider.tier}`)}</Badge>
                </div>
                <a href={`tel:${provider.phone}`} className="mt-3 inline-block">
                  <Button variant="outline" size="sm">
                    <IconPhone size={15} />
                    {t('tracking.callProvider')}
                  </Button>
                </a>
              </>
            )}
          </Card>

          <Card className="p-5">
            <dl className="grid gap-2 text-[13.5px]">
              <Line label={t('wizard.step1')} value={categoryName(category, locale)} />
              <Line label={t('tracking.scheduled')} value={`${date(booking.confirmed_date)} · ${slot(booking.confirmed_slot)}`} />
              <Line label={t('tracking.price')} value={taka(booking.agreed_price)} strong />
              {request && <Line label={t('wizard.address')} value={`${request.address}, ${areaName(request.area, locale)}`} />}
            </dl>
            {request?.problem_description && (
              <p className="mt-3 rounded-lg bg-stone-base/70 p-3 text-[13px] leading-snug text-ink-soft">
                {request.problem_description}
              </p>
            )}
            {request?.image_url && (
              <img src={request.image_url} alt="" className="mt-3 w-full rounded-lg border border-stone-line" />
            )}
          </Card>
        </div>
      </div>

      {/* Payment call to action, live as soon as the technician starts work. */}
      {invoice && invoice.payment_status === 'pending' && (
        <Card className="mt-4 flex flex-wrap items-center gap-4 border-amber/40 bg-amber-wash p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber text-ink">
            <IconQr size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[17px]">{t('tracking.payNow')}</p>
            <p className="text-[13px] text-ink-soft">{t('tracking.payNowDesc')}</p>
          </div>
          <Link to={`/pay/${invoice.qr_token}`}>
            <Button variant="primary">{t('tracking.openInvoice')}</Button>
          </Link>
        </Card>
      )}

      {booking.status === 'completed' && (
        <Card className="mt-4 flex flex-wrap items-center gap-3 p-5">
          {review ? (
            <>
              <Stars value={review.rating} size={18} />
              <p className="flex-1 text-[13.5px] text-ink-soft">{review.comment || t('rate.thanks')}</p>
            </>
          ) : (
            <>
              <p className="flex-1 text-[14px] font-semibold">{t('rate.title')}</p>
              <Button variant="accent" onClick={() => setRateOpen(true)}>
                {t('tracking.rate')}
              </Button>
            </>
          )}
          <Button variant="danger" size="sm" onClick={() => setReportOpen(true)}>
            {t('tracking.report')}
          </Button>
        </Card>
      )}

      <Modal
        open={rateOpen}
        onClose={() => setRateOpen(false)}
        title={t('rate.title')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="accent" onClick={() => void sendReview()}>
              {t('rate.submit')}
            </Button>
          </>
        }
      >
        <p className="mb-3 text-[13px] text-ink-soft">{t('rate.subtitle')}</p>
        <StarPicker value={rating} onChange={setRating} />
        <div className="mt-4">
          <Field label={t('rate.comment')}>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('rate.commentPlaceholder')}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={t('tracking.reportTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReportOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={() => void sendReport()}>
              {t('common.submit')}
            </Button>
          </>
        }
      >
        <Field label={t('common.reason')}>
          <Textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder={t('tracking.reportPlaceholder')}
          />
        </Field>
      </Modal>
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-ink-soft">{label}</dt>
      <dd className={`text-right ${strong ? 'num font-semibold' : ''}`}>{value}</dd>
    </div>
  );
}
