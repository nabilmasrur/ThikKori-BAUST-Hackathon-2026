import { QRCodeSVG } from 'qrcode.react';
import { PUBLIC_ORIGIN } from '@/lib/constants';
import { useFmt } from '@/lib/useFmt';
import type { Invoice } from '@/types';

export function invoiceUrl(invoice: Invoice): string {
  return `${PUBLIC_ORIGIN}/pay/${invoice.qr_token}`;
}

/**
 * The demo moment: a code the customer scans with their phone camera.
 * It encodes only the invoice's opaque token — no account, no login.
 */
export function PaymentQR({ invoice }: { invoice: Invoice }) {
  const { t, taka } = useFmt();
  const url = invoiceUrl(invoice);

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-[13.5px] text-ink-soft">{t('provider.qrDesc')}</p>
      <div className="mt-4 rounded-2xl border border-stone-line bg-white p-4">
        <QRCodeSVG value={url} size={224} level="M" fgColor="#1D4B4A" bgColor="#FFFFFF" />
      </div>
      <p className="mt-4 text-[12px] font-semibold text-ink-soft">{t('provider.qrAmount')}</p>
      <p className="num font-display text-[34px] leading-none text-ink">{taka(invoice.total)}</p>
      <p className="num mt-3 max-w-full break-all font-mono text-[11px] text-ink-faint">{url}</p>
    </div>
  );
}
