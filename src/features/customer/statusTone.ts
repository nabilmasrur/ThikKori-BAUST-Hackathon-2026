import type { BookingStatus } from '@/types';

/** Colour carries the status everywhere it appears. */
export const STATUS_TONE: Record<BookingStatus, 'teal' | 'amber' | 'sage' | 'brick' | 'neutral'> = {
  requested: 'neutral',
  accepted: 'teal',
  on_the_way: 'amber',
  in_progress: 'amber',
  completed: 'sage',
  cancelled: 'brick',
};
