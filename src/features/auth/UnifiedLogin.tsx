import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button, Field, Input } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '@/lib/constants';
import { useSession } from '@/state/SessionContext';
import { useData } from '@/state/DataContext';
import { useFmt } from '@/lib/useFmt';
import { IconArrowLeft } from '@/components/Icons';

export function UnifiedLogin() {
  const { db } = useData();
  const { signIn } = useSession();
  const { t } = useFmt();
  const navigate = useNavigate();
  const location = useLocation();
  const roleParam = new URLSearchParams(location.search).get('role');
  
  const [roleMode, setRoleMode] = useState<'customer' | 'provider' | 'admin'>(
    roleParam === 'provider' ? 'provider' : roleParam === 'admin' ? 'admin' : 'customer'
  );
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    const emailTrimmed = email.trim().toLowerCase();

    if (roleMode === 'admin') {
      if (emailTrimmed === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
        signIn('admin', 'admin');
        navigate('/admin', { replace: true });
        return;
      }
    } else if (roleMode === 'customer') {
      const customer = db.customers.find((c) => c.email?.toLowerCase() === emailTrimmed && c.password === password);
      if (customer) {
        signIn('customer', customer.id, customer.preferred_language);
        navigate('/customer', { replace: true });
        return;
      }
    } else if (roleMode === 'provider') {
      const provider = db.providers.find((p) => p.email?.toLowerCase() === emailTrimmed && p.password === password);
      if (provider) {
        signIn('provider', provider.id, provider.preferred_language);
        navigate('/provider', { replace: true });
        return;
      }
    }

    setError(t('auth.invalid') || 'Invalid email or password');
  };

  return (
    <main className="flex min-h-[100dvh]">
      {/* Left side: Beautiful image / branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-teal-deep p-12 lg:flex relative overflow-hidden">
        <Sheen />
        <div className="relative z-10">
          <Link to="/">
            <Logo size="lg" onDark />
          </Link>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-[40px] leading-tight text-stone-base">
            Your home, automated.
          </h1>
          <p className="mt-4 text-stone-base/80 text-[18px]">
            Log in to manage your services, track bookings, and grow your business with ThikKori.
          </p>
        </div>
        <div className="relative z-10 text-[13px] text-stone-base/40">
          © 2026 ThikKori. All rights reserved.
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="flex w-full flex-col bg-stone-base lg:w-1/2">
        <div className="flex items-center justify-between p-5 lg:justify-end">
          <div className="lg:hidden flex items-center gap-4">
            <Link
              to="/"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-stone-deep hover:text-ink transition-colors"
              title={t('common.back') || 'Back'}
            >
              <IconArrowLeft size={20} />
            </Link>
            <Link to="/">
              <Logo size="sm" />
            </Link>
          </div>
          <LanguageToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 pb-20">
          
          {roleMode !== 'admin' && (
            <div className="mb-8 flex rounded-full bg-stone-line/30 p-1">
              <button
                type="button"
                onClick={() => setRoleMode('customer')}
                className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all ${roleMode === 'customer' ? 'bg-white shadow-sm text-teal-deep' : 'text-ink-soft hover:text-ink'}`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRoleMode('provider')}
                className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all ${roleMode === 'provider' ? 'bg-white shadow-sm text-teal-deep' : 'text-ink-soft hover:text-ink'}`}
              >
                Provider
              </button>
            </div>
          )}

          <h2 className="font-display text-[28px] text-ink">
            {roleMode === 'customer' ? 'Customer Sign In' : roleMode === 'provider' ? 'Provider Sign In' : 'Admin Sign In'}
          </h2>
          <p className="mt-2 text-[14px] text-ink-soft">Enter your details to sign in to your account</p>

          <form onSubmit={submit} className="mt-8 grid gap-4">
            <Field label={t('auth.email') || 'Email'}>
              <Input
                type="email"
                autoComplete="username"
                value={email}
                placeholder={roleMode === 'customer' ? "customer1@thikkori.com" : roleMode === 'provider' ? "provider1@thikkori.com" : "admin@thikkori.com.bd"}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
              />
            </Field>
            <Field label={t('auth.password') || 'Password'} error={error || undefined}>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                placeholder="••••••••"
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
              />
            </Field>

            <Button type="submit" variant="primary" className="mt-2" full>
              {t('auth.signIn') || 'Sign In'}
            </Button>

            <p className="mt-4 text-center text-[13px] text-ink-soft">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-teal hover:underline">
                {t('auth.signUp') || 'Sign up'}
              </Link>
            </p>
          </form>

          {/* Demo Hint */}
          <div className="mt-10 rounded-xl bg-teal-wash p-4 text-[13px] text-teal-deep">
            <p className="font-semibold mb-2">Demo Credentials:</p>
            <ul className="grid gap-1.5 list-disc pl-4 opacity-80">
              <li>Customer: <span className="font-mono text-xs">customer1@thikkori.com / demo123</span></li>
              <li>Provider: <span className="font-mono text-xs">provider1@thikkori.com / demo123</span></li>
              <li>Admin: <span className="font-mono text-xs">admin@thikkori.com.bd / thikkori-admin-2026</span></li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

function Sheen() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute -left-24 top-1/3 h-[420px] w-[420px] rounded-full bg-teal-soft/20 blur-[90px]" />
      <div className="absolute right-0 top-0 h-40 w-40 border-b border-l border-amber/20" />
      <div className="absolute bottom-0 left-0 h-40 w-40 border-r border-t border-amber/15" />
    </div>
  );
}
