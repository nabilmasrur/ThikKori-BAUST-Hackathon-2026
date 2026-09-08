import { Link, useNavigate } from 'react-router-dom';
import { Badge, Card } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Stars } from '@/components/Stars';
import { useData } from '@/state/DataContext';
import { useSession } from '@/state/SessionContext';
import { useFmt } from '@/lib/useFmt';
import { areaName } from '@/lib/labels';
import { IconWrench, IconArrowLeft } from '@/components/Icons';

export function ProviderLogin() {
  const { db } = useData();
  const { signIn } = useSession();
  const { t, locale, num } = useFmt();
  const navigate = useNavigate();

  return (
    <main className="min-h-[100dvh]">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-stone-deep hover:text-ink transition-colors"
            title={t('common.back') || 'Back'}
          >
            <IconArrowLeft size={20} />
          </button>
          <Link to="/panels">
            <Logo size="sm" />
          </Link>
        </div>
        <LanguageToggle />
      </div>

      <div className="mx-auto max-w-4xl px-5 pb-16">
        <h1 className="font-display text-[28px]">{t('auth.providerTitle')}</h1>
        <p className="mt-1.5 text-[14px] text-ink-soft">{t('auth.providerHint')}</p>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {db?.providers.map((p) => (
            <Card key={p.id} className="p-0">
              <button
                type="button"
                disabled={p.suspended}
                onClick={() => {
                  signIn('provider', p.id, p.preferred_language);
                  navigate('/provider', { replace: true });
                }}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-stone-base/70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-wash text-teal">
                  <IconWrench size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{p.business_name}</span>
                  <span className="block truncate text-[12.5px] text-ink-faint">
                    {p.name} · {areaName(p.base_area, locale)}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <Stars value={p.rating} />
                  <span className="mt-1 block">
                    <Badge tone="amber">{t(`tier.${p.tier}`)}</Badge>
                  </span>
                </span>
              </button>
              <div className="border-t border-stone-line px-4 py-1.5 text-[11.5px] text-ink-faint">
                {num(p.completed_jobs_count)} {t('provider.jobsDone').toLowerCase()}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
