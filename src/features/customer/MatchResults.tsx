import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import { IconClock, IconPin, IconStar, IconTaka, IconTier, IconWrench } from '@/components/Icons';
import { NotFound } from '@/features/errors/NotFound';
import { confirmBooking } from '@/data/operations';
import { useData } from '@/state/DataContext';
import { useToast } from '@/state/ToastContext';
import { useFmt } from '@/lib/useFmt';
import { areaName, categoryName } from '@/lib/labels';
import { cn } from '@/lib/cn';
import type { Customer, ScoreComponent } from '@/types';

export function MatchResults({ customer }: { customer: Customer }) {
  const { requestId } = useParams();
  const { db, adapter } = useData();
  const { push } = useToast();
  const { t, locale, taka, num, pct, digits, slot: fmtSlot, date } = useFmt();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);

  if (!db) return null;
  const request = db.requests.find((r) => r.id === requestId && r.customer_id === customer.id);
  if (!request) return <NotFound />;

  const category = db.service_categories.find((c) => c.id === request.service_category_id);
  const matches = db.request_matches
    .filter((m) => m.request_id === request.id && m.status !== 'declined')
    .sort((a, b) => b.match_score - a.match_score);

  const book = async (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;
    setBusy(matchId);
    try {
      const booking = await confirmBooking(adapter, db, { request, match });
      const provider = db.providers.find((p) => p.id === match.provider_id);
      push(
        t('toast.booked', {
          name: provider?.business_name ?? '',
          slot: fmtSlot(booking.confirmed_slot),
        }),
        'success',
      );
      navigate(`/customer/booking/${booking.id}`);
    } catch (e) {
      push(e instanceof Error && e.message === 'slot_taken' ? t('match.slotTaken') : t('errors.loadFailed'), 'alert');
    } finally {
      setBusy(null);
    }
  };

  const label = (c: ScoreComponent): string => {
    switch (c.key) {
      case 'availability':
        return t('match.availability', { slot: fmtSlot(c.detail.extra ?? '') });
      case 'distance':
        return t('match.distance', { value: digits(String(c.detail.value)) });
      case 'rating':
        return t('match.rating', { value: digits(c.detail.value.toFixed(1)) });
      case 'price':
        return t('match.price', { value: taka(c.detail.value) });
      case 'expertise':
        return t('match.expertise', { value: num(c.detail.value) });
      case 'tier':
        return t('match.tier', { tier: t(`tier.${c.detail.extra}`) });
    }
  };

  const icon = (key: ScoreComponent['key']) => {
    const cls = 'text-teal';
    switch (key) {
      case 'availability':
        return <IconClock size={15} className={cls} />;
      case 'distance':
        return <IconPin size={15} className={cls} />;
      case 'rating':
        return <IconStar filled size={15} className="text-amber" />;
      case 'price':
        return <IconTaka size={15} className={cls} />;
      case 'expertise':
        return <IconWrench size={15} className={cls} />;
      case 'tier':
        return <IconTier size={15} className={cls} />;
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-[24px]">{t('match.title')}</h1>
      <p className="mt-1.5 text-[13.5px] text-ink-soft">{t('match.subtitle')}</p>

      <Card className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-[13px]">
        <span className="font-semibold">{categoryName(category, locale)}</span>
        <span className="text-ink-soft">{areaName(request.area, locale)}</span>
        <span className="num text-ink-soft">
          {date(request.preferred_date)} · {fmtSlot(request.preferred_time_window)}
        </span>
        <Badge tone={request.urgency === 'normal' ? 'teal' : 'brick'}>{t(`urgency.${request.urgency}`)}</Badge>
      </Card>

      {matches.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<IconClock size={22} />}
            title={t('errors.noProvidersTitle')}
            description={t('errors.noProvidersDesc')}
            action={
              <Button variant="accent" onClick={() => navigate('/customer/new')}>
                {t('errors.noProvidersAction')}
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {matches.map((m, rank) => {
            const provider = db.providers.find((p) => p.id === m.provider_id);
            if (!provider) return null;
            const b = m.score_breakdown;
            const components = [...(b.components ?? [])].sort((x, y) => y.share - x.share);
            return (
              <Card key={m.id} className={cn('p-5', rank === 0 && 'border-teal/50')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-[19px]">{provider.business_name}</h2>
                      {rank === 0 && <Badge tone="amber">1</Badge>}
                      <Badge tone="teal">{t(`tier.${provider.tier}`)}</Badge>
                    </div>
                    <p className="mt-0.5 text-[13px] text-ink-soft">
                      {provider.name} · {areaName(provider.base_area, locale)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="num font-display text-[26px] leading-none text-teal">
                      {t('match.score', { value: digits(String(Math.round(b.total * 100))) })}
                    </p>
                    <p className="num mt-1 text-[13px] font-semibold">{taka(b.quoted_price)}</p>
                  </div>
                </div>

                {/* Explainable breakdown — the same numbers the ranking used. */}
                <div className="mt-4 rounded-lg border border-stone-line bg-stone-base/50 p-3.5">
                  <p className="mb-2.5 text-[12px] font-semibold text-ink-soft">{t('match.why')}</p>
                  <ul className="grid gap-2">
                    {components.map((c) => (
                      <li key={c.key} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-2 text-[13px]">
                          {icon(c.key)}
                          <span className="truncate">{label(c)}</span>
                        </span>
                        <span className="num text-[12.5px] font-semibold text-ink-soft">
                          {t('match.contributes', { value: pct(c.share) })}
                        </span>
                        <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-stone-line">
                          <span
                            className={cn('block h-full rounded-full', c.key === 'rating' ? 'bg-amber' : 'bg-teal')}
                            style={{ width: `${Math.round(c.share * 100)}%` }}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                  {components.length === 0 && (
                    <p className="num text-[12.5px] text-ink-soft">
                      {t('match.distance', { value: digits(String(b.distance_km)) })} ·{' '}
                      {t('match.availability', { slot: fmtSlot(b.slot) })}
                    </p>
                  )}
                  <p className="num mt-3 border-t border-stone-line pt-2.5 text-[11px] leading-snug text-ink-faint">
                    {t('match.formula')}
                  </p>
                </div>

                <Button
                  variant={rank === 0 ? 'accent' : 'outline'}
                  className="mt-4"
                  full
                  disabled={busy !== null}
                  onClick={() => void book(m.id)}
                >
                  {busy === m.id ? t('match.booking') : t('match.book')}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
