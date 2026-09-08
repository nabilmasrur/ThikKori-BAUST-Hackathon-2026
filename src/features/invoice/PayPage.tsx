import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { payInvoice } from '@/data/operations';
import { useData } from '@/state/DataContext';
import { useFmt } from '@/lib/useFmt';
import { categoryName, shortRef } from '@/lib/labels';
import { cn } from '@/lib/cn';
import type { PaymentMethod } from '@/types';

const METHODS: { key: PaymentMethod; color: string; ink: string }[] = [
  { key: 'bkash', color: '#E2136E', ink: '#FFFFFF' },
  { key: 'nagad', color: '#EE7623', ink: '#FFFFFF' },
  { key: 'cash', color: '#DEDCD3', ink: '#1C1A17' },
];

/**
 * Public invoice page. Reached only by scanning the technician's QR code —
 * the opaque token is the entire credential, so no login is required.
 */
export default function PayPage() {
  const { token } = useParams();
  const { db, adapter } = useData();
  const { t, locale, taka, num, dateTime, digits } = useFmt();
  const [method, setMethod] = useState<PaymentMethod>('bkash');
  const [busy, setBusy] = useState(false);
  const [justPaid, setJustPaid] = useState(false);

  const invoice = db?.invoices.find((i) => i.qr_token === token);

  if (!db) return null;

  if (!invoice) {
    return (
      <Sheet>
        <div className="py-10 text-center">
          <h1 className="font-display text-[22px]">{t('errors.invalidTokenTitle')}</h1>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] text-ink-soft">{t('errors.invalidTokenDesc')}</p>
          <Link to="/panels" className="mt-6 inline-block">
            <Button variant="outline">{t('invoice.backHome')}</Button>
          </Link>
        </div>
      </Sheet>
    );
  }

  const booking = db.bookings.find((b) => b.id === invoice.booking_id);
  const request = db.requests.find((r) => r.id === booking?.request_id);
  const category = db.service_categories.find((c) => c.id === request?.service_category_id);
  const provider = db.providers.find((p) => p.id === invoice.provider_id);
  const customer = db.customers.find((c) => c.id === invoice.customer_id);
  const paid = invoice.payment_status === 'paid';

  const confirm = async () => {
    setBusy(true);
    try {
      await payInvoice(adapter, db, invoice, method);
      setJustPaid(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet>
      {/* Receipt head */}
      <div className="flex items-start justify-between gap-4 border-b border-dashed border-stone-line pb-4">
        <Logo size="sm" />
        <div className="text-right">
          <p className="text-[11px] uppercase-none tracking-wide text-ink-faint">{t('invoice.title')}</p>
          <p className="num font-mono text-[12.5px] font-semibold">{shortRef(invoice.id)}</p>
        </div>
      </div>

      {justPaid || paid ? (
        <PaidBanner
          justPaid={justPaid}
          paidAt={invoice.paid_at ? dateTime(invoice.paid_at) : ''}
          method={t(`invoice.${invoice.payment_method ?? method}`)}
        />
      ) : null}

      {/* Parties */}
      <div className="grid gap-4 py-4 text-[13px] sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold text-ink-faint">{t('invoice.servedBy')}</p>
          <p className="mt-0.5 font-semibold">{provider?.business_name}</p>
          <p className="text-ink-soft">{provider?.name}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-[11px] font-semibold text-ink-faint">{t('invoice.billedTo')}</p>
          <p className="mt-0.5 font-semibold">{customer?.name}</p>
          <p className="num text-ink-soft">{customer?.phone}</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-2 border-y border-stone-line py-3 text-[12.5px]">
        <span className="text-ink-soft">{t('invoice.job')}</span>
        <span className="font-semibold">{categoryName(category, locale)}</span>
        <span className="text-ink-soft">{t('invoice.issued')}</span>
        <span className="num">{dateTime(invoice.generated_at)}</span>
      </div>

      {/* Line items */}
      <table className="mt-4 w-full text-[13px]">
        <thead>
          <tr className="border-b border-stone-line text-left text-[11px] text-ink-faint">
            <th className="pb-1.5 font-semibold">{t('invoice.description')}</th>
            <th className="pb-1.5 text-center font-semibold">{t('invoice.qty')}</th>
            <th className="pb-1.5 text-right font-semibold">{t('invoice.amount')}</th>
          </tr>
        </thead>
        <tbody>
          {invoice.line_items.map((li, i) => (
            <tr key={i} className="border-b border-dotted border-stone-line">
              <td className="py-2.5">{locale === 'bn' ? li.description_bn : li.description}</td>
              <td className="num py-2.5 text-center text-ink-soft">{num(li.quantity)}</td>
              <td className="num py-2.5 text-right font-mono">{taka(li.unit_price * li.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="mt-4 space-y-1.5 text-[13px]">
        <Row label={t('invoice.subtotal')} value={taka(invoice.subtotal)} />
        <Row label={t('invoice.platformFee')} value={taka(invoice.platform_fee)} muted />
      </dl>

      <div className="mt-3 flex items-end justify-between border-t-2 border-ink/80 pt-3">
        <span className="text-[13px] font-semibold text-ink-soft">{t('invoice.total')}</span>
        <span className="num font-mono text-[32px] font-semibold leading-none">{taka(invoice.total)}</span>
      </div>

      {!paid && !justPaid ? (
        <div className="no-print mt-6">
          <p className="label-field">{t('invoice.selectMethod')}</p>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMethod(m.key)}
                aria-pressed={method === m.key}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-colors',
                  method === m.key ? 'border-ink' : 'border-stone-line hover:border-ink/30',
                )}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg font-display text-[15px] font-bold"
                  style={{ background: m.color, color: m.ink }}
                >
                  {m.key === 'bkash' ? 'b' : m.key === 'nagad' ? 'N' : '৳'}
                </span>
                <span className="text-center text-[12px] font-semibold leading-tight">{t(`invoice.${m.key}`)}</span>
              </button>
            ))}
          </div>

          <Button variant="accent" size="lg" className="mt-4" full disabled={busy} onClick={() => void confirm()}>
            {busy ? t('invoice.confirming') : t('invoice.confirm')}
          </Button>
        </div>
      ) : (
        <div className="no-print mt-6 grid gap-2 sm:grid-cols-2">
          <Button variant="outline" onClick={() => window.print()}>
            {t('invoice.print')}
          </Button>
          <Link to={booking ? `/customer/booking/${booking.id}` : '/panels'}>
            <Button variant="primary" full>
              {t('invoice.rateNow')}
            </Button>
          </Link>
        </div>
      )}

      <p className="num mt-6 border-t border-dashed border-stone-line pt-3 text-center font-mono text-[10.5px] text-ink-faint">
        ThikKori · {digits(String(Math.round(invoice.platform_fee / Math.max(1, invoice.subtotal) * 100)))}% platform fee
        · token {invoice.qr_token.slice(0, 8)}…
      </p>
    </Sheet>
  );
}

function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[100dvh] bg-[#FAF9F6] px-4 py-6">
      <div className="no-print mx-auto mb-4 flex max-w-md justify-end">
        <LanguageToggle compact />
      </div>
      <div className="mx-auto max-w-md rounded-xl border border-stone-line bg-[#FAF9F6] p-6 shadow-raise">
        {children}
      </div>
    </main>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className={muted ? 'text-ink-faint' : 'text-ink-soft'}>{label}</dt>
      <dd className={cn('num font-mono', muted && 'text-ink-faint')}>{value}</dd>
    </div>
  );
}

/** One entrance animation, on the only moment that deserves it. */
function PaidBanner({
  justPaid,
  paidAt,
  method,
}: {
  justPaid: boolean;
  paidAt: string;
  method: string;
}) {
  const { t } = useFmt();
  return (
    <div className="my-4 flex flex-col items-center rounded-xl border border-sage/30 bg-sage-wash px-4 py-5 text-center">
      <span className="flex h-12 w-12 animate-pop items-center justify-center rounded-full bg-sage">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F2F1EC" strokeWidth="3">
          <path
            d="m5 12.5 4.5 4.5L19 7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-stroke"
            style={{ strokeDasharray: 48 }}
          />
        </svg>
      </span>
      {justPaid ? (
        <>
          <p className="mt-3 font-display text-[16px] text-sage">{t('invoice.paidTitle')}</p>
          <p lang="bn" className="font-display text-[16px] text-sage">
            {t('invoice.paidTitleBn')}
          </p>
        </>
      ) : (
        <p className="mt-3 font-display text-[16px] text-sage">{t('errors.alreadyPaidTitle')}</p>
      )}
      {paidAt && <p className="num mt-1 text-[12.5px] text-ink-soft">{t('invoice.paidOn', { date: paidAt })}</p>}
      <p className="mt-0.5 text-[12.5px] text-ink-soft">{t('invoice.paidVia', { method })}</p>
    </div>
  );
}
