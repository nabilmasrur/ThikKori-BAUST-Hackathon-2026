import { Badge, Card, ProgressBar, SectionTitle, Stat } from '@/components/ui';
import { IconStar, IconTier } from '@/components/Icons';
import { TIER_ORDER, TIERS } from '@/lib/constants';
import { nextTier } from '@/lib/matching';
import { useData } from '@/state/DataContext';
import { useFmt } from '@/lib/useFmt';
import { cn } from '@/lib/cn';
import type { Provider } from '@/types';

export function Growth({ provider }: { provider: Provider }) {
  const { db } = useData();
  const { t, taka, num, digits, pct, locale } = useFmt();
  if (!db) return null;

  const tier = TIERS.find((x) => x.tier_name === provider.tier) ?? TIERS[0];
  const upcoming = nextTier(provider.tier);
  const challenges = db.challenges.filter((c) => c.provider_id === provider.id);

  // Leaderboard: paid work in the last seven days, all providers.
  const weekAgo = Date.now() - 7 * 864e5;
  const board = db.providers
    .map((p) => ({
      provider: p,
      earned: db.invoices
        .filter(
          (i) =>
            i.provider_id === p.id &&
            i.payment_status === 'paid' &&
            new Date(i.paid_at ?? 0).getTime() >= weekAgo,
        )
        .reduce((s, i) => s + i.subtotal, 0),
    }))
    .sort((a, b) => b.earned - a.earned)
    .slice(0, 6);

  return (
    <div className="grid gap-6">
      <h1 className="font-display text-[24px]">{t('growth.title')}</h1>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber text-ink">
            <IconTier size={26} />
          </span>
          <div>
            <p className="text-[12px] font-semibold text-ink-soft">{t('growth.tier')}</p>
            <p className="font-display text-[26px] leading-tight">{t(`tier.${provider.tier}`)}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Badge tone="teal">
              {t('growth.tierBonus')} +{digits(tier.match_score_bonus.toFixed(2))}
            </Badge>
            <Badge tone="amber">
              {t('growth.wageCap')} ×{digits(tier.max_wage_multiplier.toFixed(2))}
            </Badge>
          </div>
        </div>

        {/* The ladder, with the current rung marked. */}
        <ol className="mt-5 grid grid-cols-5 gap-1.5">
          {TIER_ORDER.map((name) => {
            const reached = TIER_ORDER.indexOf(name) <= TIER_ORDER.indexOf(provider.tier);
            return (
              <li key={name} className="text-center">
                <span
                  className={cn(
                    'block h-1.5 rounded-full',
                    reached ? 'bg-teal' : 'bg-stone-line',
                    name === provider.tier && 'bg-amber',
                  )}
                />
                <span className={cn('mt-1.5 block text-[11.5px]', reached ? 'text-ink' : 'text-ink-faint')}>
                  {t(`tier.${name}`)}
                </span>
              </li>
            );
          })}
        </ol>

        {upcoming ? (
          <div className="mt-5 rounded-lg border border-stone-line bg-stone-base/60 p-4">
            <p className="text-[13.5px] font-semibold">
              {t('growth.progressTo', { tier: t(`tier.${upcoming.tier_name}`) })}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 flex justify-between text-[12px] text-ink-soft">
                  <span>{t('provider.jobsDone')}</span>
                  <span className="num">
                    {num(provider.completed_jobs_count)} / {num(upcoming.min_jobs)}
                  </span>
                </div>
                <ProgressBar value={provider.completed_jobs_count} max={upcoming.min_jobs} />
                <p className="mt-1 text-[11.5px] text-ink-faint">
                  {t('growth.needJobs', { n: num(Math.max(0, upcoming.min_jobs - provider.completed_jobs_count)) })}
                </p>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[12px] text-ink-soft">
                  <span>{t('provider.earned')}</span>
                  <span className="num">
                    {taka(provider.total_earnings)} / {taka(upcoming.min_earnings)}
                  </span>
                </div>
                <ProgressBar value={provider.total_earnings} max={upcoming.min_earnings} tone="amber" />
                <p className="mt-1 text-[11.5px] text-ink-faint">
                  {t('growth.needEarnings', {
                    amount: taka(Math.max(0, upcoming.min_earnings - provider.total_earnings)),
                  })}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-5 text-[13.5px] font-semibold text-sage">{t('growth.maxTier')}</p>
        )}
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t('provider.rating')} value={digits(provider.rating.toFixed(1))} icon={<IconStar filled size={18} />} />
        <Stat label={t('provider.jobsDone')} value={num(provider.completed_jobs_count)} />
        <Stat label={t('provider.earned')} value={taka(provider.total_earnings)} tone="sage" />
      </div>

      <section>
        <SectionTitle title={t('growth.challenges')} />
        {challenges.length === 0 ? (
          <Card className="p-4 text-[13.5px] text-ink-soft">{t('growth.noChallenges')}</Card>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-3">
            {challenges.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={c.type === 'daily' ? 'amber' : c.type === 'weekly' ? 'teal' : 'sage'}>
                    {t(`growth.${c.type}`)}
                  </Badge>
                  <span className="num text-[12px] font-semibold text-ink-soft">
                    {num(c.progress)}/{num(c.goal)}
                  </span>
                </div>
                <p className="mt-2.5 text-[13.5px] font-semibold leading-snug">
                  {locale === 'bn' ? c.title_bn : c.title}
                </p>
                <div className="mt-3">
                  <ProgressBar
                    value={c.progress}
                    max={c.goal}
                    tone={c.status === 'completed' ? 'sage' : 'teal'}
                    label={c.title}
                  />
                </div>
                <p className="mt-2 text-[12px] text-ink-soft">
                  {c.status === 'completed' ? t('growth.done') : t('growth.reward', { amount: taka(c.reward) })}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle title={t('growth.leaderboard')} />
        <Card className="divide-y divide-stone-line">
          {board.map((row, i) => (
            <div
              key={row.provider.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3',
                row.provider.id === provider.id && 'bg-teal-wash',
              )}
            >
              <span className="num w-6 shrink-0 font-display text-[16px] text-ink-faint">{num(i + 1)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">{row.provider.business_name}</span>
                <span className="block text-[12px] text-ink-faint">
                  {t(`tier.${row.provider.tier}`)} · {pct(Math.min(1, row.provider.rating / 5))}
                </span>
              </span>
              {row.provider.id === provider.id && <Badge tone="teal">{t('growth.you')}</Badge>}
              <span className="num shrink-0 text-[14px] font-semibold">{taka(row.earned)}</span>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
