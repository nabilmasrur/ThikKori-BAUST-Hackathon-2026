import type { Locale } from '@/types';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/** Convert every ASCII digit in a string to Bengali numerals. */
export function toBanglaDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function localizeDigits(input: string, locale: Locale): string {
  return locale === 'bn' ? toBanglaDigits(input) : input;
}

/** ৳1,500 / ৳১,৫০০ — always comma-grouped, always with the taka sign. */
export function formatTaka(amount: number, locale: Locale, opts?: { decimals?: boolean }): string {
  const n = Number.isFinite(amount) ? amount : 0;
  const body = n.toLocaleString('en-US', {
    minimumFractionDigits: opts?.decimals ? 2 : 0,
    maximumFractionDigits: opts?.decimals ? 2 : 0,
  });
  return `৳${localizeDigits(body, locale)}`;
}

export function formatNumber(value: number, locale: Locale): string {
  return localizeDigits(value.toLocaleString('en-US'), locale);
}

export function formatPercent(fraction: number, locale: Locale): string {
  return `${localizeDigits(Math.round(fraction * 100).toString(), locale)}%`;
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_BN = ['জানু', 'ফেব', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুল', 'আগ', 'সেপ্ট', 'অক্টো', 'নভে', 'ডিসে'];
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_BN = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

export function monthLabel(monthIndex: number, locale: Locale): string {
  return locale === 'bn' ? MONTHS_BN[monthIndex] : MONTHS_EN[monthIndex];
}

/** "12 Mar 2026" / "১২ মার্চ ২০২৬" */
export function formatDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const body = `${d.getDate()} ${monthLabel(d.getMonth(), locale)} ${d.getFullYear()}`;
  return localizeDigits(body, locale);
}

export function formatDayName(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return locale === 'bn' ? DAYS_BN[d.getDay()] : DAYS_EN[d.getDay()];
}

/** "12 Mar 2026, 4:30 PM" with Bengali numerals when relevant. */
export function formatDateTime(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${formatDate(iso, locale)}, ${formatTime(d, locale)}`;
}

export function formatTime(value: Date | string, locale: Locale): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  let h = d.getHours();
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const body = `${h}:${d.getMinutes().toString().padStart(2, '0')}`;
  return `${localizeDigits(body, locale)} ${locale === 'bn' ? (suffix === 'AM' ? 'AM' : 'PM') : suffix}`;
}

/** "16:00-18:00" → "4:00 PM – 6:00 PM" (localized digits) */
export function formatSlot(slot: string, locale: Locale): string {
  const [from, to] = slot.split('-');
  const label = (hhmm: string) => {
    const [hStr, m] = hhmm.split(':');
    let h = Number(hStr);
    const suffix = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${localizeDigits(`${h}:${m}`, locale)} ${suffix}`;
  };
  if (!from || !to) return slot;
  return `${label(from)} – ${label(to)}`;
}

export function relativeTime(iso: string, locale: Locale, t: (k: string, o?: object) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return t('time.justNow');
  if (mins < 60) return t('time.minutesAgo', { n: localizeDigits(String(mins), locale) });
  const hours = Math.round(mins / 60);
  if (hours < 24) return t('time.hoursAgo', { n: localizeDigits(String(hours), locale) });
  const days = Math.round(hours / 24);
  return t('time.daysAgo', { n: localizeDigits(String(days), locale) });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase();
}

export function maskName(name: string): string {
  const [first, ...rest] = name.split(/\s+/);
  if (!rest.length) return first;
  return `${first} ${rest[rest.length - 1][0]}.`;
}
