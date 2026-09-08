import { useTranslation } from 'react-i18next';
import { useSession } from '@/state/SessionContext';
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatSlot,
  formatTaka,
  localizeDigits,
} from '@/lib/format';
import type { Locale } from '@/types';

/** One hook for the two things almost every screen needs: strings and numbers. */
export function useFmt() {
  const { t, i18n } = useTranslation();
  const { locale } = useSession();
  const active = (i18n.language === 'bn' ? 'bn' : locale) as Locale;

  return {
    t,
    locale: active,
    taka: (n: number) => formatTaka(n, active),
    num: (n: number) => formatNumber(n, active),
    pct: (f: number) => formatPercent(f, active),
    digits: (s: string) => localizeDigits(s, active),
    date: (iso: string) => formatDate(iso, active),
    dateTime: (iso: string) => formatDateTime(iso, active),
    slot: (s: string) => formatSlot(s, active),
  };
}
