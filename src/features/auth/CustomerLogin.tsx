import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Field, Input } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { IconArrowLeft } from '@/components/Icons';
import { useData } from '@/state/DataContext';
import { useSession } from '@/state/SessionContext';
import { useFmt } from '@/lib/useFmt';
import { areaName } from '@/lib/labels';
import { initials } from '@/lib/format';

export function CustomerLogin() {
  const { db } = useData();
  const { signIn } = useSession();
  const { t, locale } = useFmt();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const enter = (id: string, preferred: 'en' | 'bn') => {
    signIn('customer', id, preferred);
    navigate('/customer', { replace: true });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const match = db?.customers.find((c) => c.phone === phone.trim());
    if (!match) return setError(t('auth.notFound'));
    if (match.suspended) return setError(t('auth.suspended'));
    enter(match.id, match.preferred_language);
  };

  return (
    <main className="min-h-[100dvh]">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
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

      <div className="mx-auto max-w-3xl px-5 pb-16">
        <h1 className="font-display text-[28px]">{t('auth.customerTitle')}</h1>
        <p className="mt-1.5 text-[14px] text-ink-soft">{t('auth.customerHint')}</p>

        <form onSubmit={submit} className="mt-6 max-w-sm">
          <Field label={t('auth.phone')} error={error || undefined}>
            <Input
              value={phone}
              inputMode="tel"
              placeholder="01711000101"
              onChange={(e) => {
                setPhone(e.target.value);
                setError('');
              }}
            />
          </Field>
          <Button type="submit" variant="accent" className="mt-3" full>
            {t('auth.signIn')}
          </Button>
        </form>

        <h2 className="mb-3 mt-9 text-[13px] font-semibold text-ink-soft">{t('auth.demoAccounts')}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {db?.customers.slice(0, 6).map((c) => (
            <Card key={c.id} className="p-0">
              <button
                type="button"
                onClick={() => enter(c.id, c.preferred_language)}
                className="flex w-full items-center gap-3 p-3 text-left hover:bg-stone-base/70"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-[12px] font-bold text-stone-base">
                  {initials(c.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold">{c.name}</span>
                  <span className="num block text-[12px] text-ink-faint">
                    {c.phone} · {areaName(c.area, locale)}
                  </span>
                </span>
              </button>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
