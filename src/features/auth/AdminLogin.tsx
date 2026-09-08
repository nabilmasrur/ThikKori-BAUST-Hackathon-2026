import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Field, Input } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '@/lib/constants';
import { useSession } from '@/state/SessionContext';
import { useFmt } from '@/lib/useFmt';
import { IconArrowLeft } from '@/components/Icons';

export function AdminLogin() {
  const { signIn } = useSession();
  const { t } = useFmt();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
      setError(t('auth.invalid'));
      return;
    }
    signIn('admin', 'admin');
    navigate('/admin', { replace: true });
  };

  return (
    <main className="min-h-[100dvh] bg-teal-deep">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-stone-base/70 hover:bg-stone-base/10 hover:text-stone-base transition-colors"
            title={t('common.back') || 'Back'}
          >
            <IconArrowLeft size={20} />
          </button>
          <Link to="/panels">
            <Logo size="sm" onDark />
          </Link>
        </div>
        <LanguageToggle />
      </div>

      <div className="mx-auto flex max-w-md flex-col justify-center px-5 py-10">
        <h1 className="font-display text-[26px] text-stone-base">{t('auth.adminTitle')}</h1>
        <p className="mt-1.5 text-[13.5px] text-stone-base/60">{t('auth.adminHint')}</p>

        <form
          onSubmit={submit}
          className="mt-6 rounded-xl border border-stone-base/15 bg-stone-raised p-5"
        >
          <div className="grid gap-3">
            <Field label={t('auth.email')}>
              <Input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
              />
            </Field>
            <Field label={t('auth.password')} error={error || undefined}>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
              />
            </Field>
          </div>
          <Button type="submit" variant="primary" className="mt-4" full>
            {t('auth.signIn')}
          </Button>
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-faint">
            VITE_ADMIN_EMAIL / VITE_ADMIN_PASSWORD — see .env.example
          </p>
        </form>
      </div>
    </main>
  );
}
