import { DHAKA_AREAS } from '@/lib/constants';
import type { Locale, ServiceCategory } from '@/types';

export function categoryName(cat: ServiceCategory | undefined, locale: Locale): string {
  if (!cat) return '—';
  return locale === 'bn' ? cat.name_bn : cat.name;
}

export function areaName(area: string, locale: Locale): string {
  if (locale !== 'bn') return area;
  return DHAKA_AREAS.find((a) => a.name === area)?.name_bn ?? area;
}

/**
 * Short human reference for a UUID, e.g. "#4F2A9C". Taken from the tail
 * rather than the head, because the head of a v4 UUID is the part seeded
 * rows share.
 */
export function shortRef(id: string): string {
  const hex = id.replace(/-/g, '');
  return `#${hex.slice(-6).toUpperCase()}`;
}
