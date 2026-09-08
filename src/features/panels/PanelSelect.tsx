import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useFmt } from '@/lib/useFmt';
import { useData } from '@/state/DataContext';
import { IconChevron, IconUsers, IconWrench, IconArrowLeft } from '@/components/Icons';
import { supabaseConfigured } from '@/data';

export function PanelSelect() {
  const { t, num } = useFmt();
  const { db } = useData();

  const panels = [
    {
      to: '/customer',
      key: 'customer',
      icon: <IconUsers size={22} />,
      stat: num(db?.customers.length ?? 0),
      statLabel: t('admin.customersRegistered'),
    },
    {
      to: '/provider',
      key: 'provider',
      icon: <IconWrench size={22} />,
      stat: num(db?.providers.length ?? 0),
      statLabel: t('nav.providers'),
    },
  ];

  return (
    <main className="min-h-[100dvh]">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-stone-deep hover:text-ink transition-colors"
            title={t('common.back') || 'Back'}
          >
            <IconArrowLeft size={20} />
          </Link>
          <Link to="/">
            <Logo />
          </Link>
        </div>
        <LanguageToggle />
      </div>

      <div className="mx-auto max-w-4xl px-5 pb-16">
        <div className="mb-8 max-w-xl">
          <h1 className="font-display text-[30px] leading-tight sm:text-[36px]">{t('panel.title')}</h1>
          <p className="mt-2 text-[15px] text-ink-soft">{t('panel.subtitle')}</p>
        </div>

        <div className="grid gap-3">
          {panels.map((p) => (
            <Link
              key={p.key}
              to={p.to}
              className="group flex items-center gap-4 rounded-xl border border-stone-line bg-stone-raised p-5 transition-colors hover:border-teal/40"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-wash text-teal">
                {p.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[19px] text-ink">{t(`panel.${p.key}`)}</span>
                <span className="mt-0.5 block text-[13.5px] leading-snug text-ink-soft">
                  {t(`panel.${p.key}Desc`)}
                </span>
              </span>
              <span className="hidden shrink-0 text-right sm:block">
                <span className="num block font-display text-[20px] text-teal">{p.stat}</span>
                <span className="block text-[11px] text-ink-faint">{p.statLabel}</span>
              </span>
              <span className="text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-teal">
                <IconChevron size={20} />
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-8 flex flex-wrap items-center gap-2 text-[12px] text-ink-faint">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-stone-line bg-stone-raised px-2 py-1">
            <span
              className={`h-1.5 w-1.5 rounded-full ${supabaseConfigured ? 'bg-sage' : 'bg-amber'}`}
              aria-hidden="true"
            />
            {t('common.backend')}: {supabaseConfigured ? t('common.supabaseBackend') : t('common.localBackend')}
          </span>
          <Link to="/language" className="underline underline-offset-2 hover:text-ink">
            {t('lang.switch')}
          </Link>
        </p>
      </div>
    </main>
  );
}
