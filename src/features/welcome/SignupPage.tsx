import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Field, Input } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { IconArrowLeft } from '@/components/Icons';
import { useFmt } from '@/lib/useFmt';

export function SignupPage() {
  const { t } = useFmt();
  const navigate = useNavigate();
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Since this is a demo, we will just show an error or mock it.
    // Real signup would hit the backend. For now, let's just show a toast or message.
    setError('Signup is disabled in this demo environment. Please use the existing demo accounts to log in.');
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
          <Link to="/">
            <Logo size="sm" />
          </Link>
        </div>
        <LanguageToggle />
      </div>

      <div className="mx-auto max-w-sm px-5 pb-16 pt-10">
        <h1 className="font-display text-[28px]">{t('auth.signUp') || 'Create an Account'}</h1>
        <p className="mt-1.5 text-[14px] text-ink-soft">Join ThikKori to request or provide services.</p>

        <form onSubmit={submit} className="mt-8 grid gap-4">
          <div className="flex gap-2 p-1 bg-stone-raised rounded-lg border border-stone-line">
            <button
              type="button"
              className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition-colors ${role === 'customer' ? 'bg-stone-base shadow-sm text-ink' : 'text-ink-soft hover:text-ink'}`}
              onClick={() => setRole('customer')}
            >
              Customer
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition-colors ${role === 'provider' ? 'bg-stone-base shadow-sm text-ink' : 'text-ink-soft hover:text-ink'}`}
              onClick={() => setRole('provider')}
            >
              Provider
            </button>
          </div>

          <Field label="Full Name">
            <Input
              value={name}
              placeholder="e.g. Ayesha Siddiqua"
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
            />
          </Field>

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

          <Button type="submit" variant="accent" className="mt-2" full>
            {t('auth.signUp') || 'Sign Up'}
          </Button>

          <p className="mt-4 text-center text-[13px] text-ink-soft">
            Already have an account?{' '}
            <Link to="/panels" className="font-semibold text-teal hover:underline">
              {t('auth.signIn') || 'Log in'}
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
