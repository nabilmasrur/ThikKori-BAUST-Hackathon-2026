import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useFmt } from '@/lib/useFmt';

export function WelcomePage() {
  const { t } = useFmt();

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-teal-deep px-5 py-12">
      <Sheen />

      <div className="absolute top-5 right-5 z-20">
        <LanguageToggle />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center">
        <Logo size="lg" onDark className="mx-auto mb-10 justify-center" />
        
        <h1 className="mb-2 font-display text-[32px] leading-tight text-stone-base sm:text-[40px]">
          {t('lang.title') || 'Welcome to ThikKori'}
        </h1>
        <p className="mb-10 text-[15px] text-stone-base/70">
          Smart home service automation platform. <br />
          <span lang="bn" className="text-amber">ঘরের কাজ, ঠিক সময়ে</span>
        </p>

        <div className="mx-auto flex max-w-sm flex-col gap-4 sm:flex-row">
          <Link to="/panels" className="flex-1 rounded-xl bg-amber px-4 py-3.5 text-center font-semibold text-ink transition-transform active:scale-[0.98] sm:py-4">
            {t('auth.signIn') || 'Log In'}
          </Link>
          <Link to="/signup" className="flex-1 rounded-xl bg-stone-base/10 px-4 py-3.5 text-center font-semibold text-stone-base transition-all hover:bg-stone-base/20 active:scale-[0.98] sm:py-4">
            {t('auth.signUp') || 'Sign Up'}
          </Link>
        </div>

        <p className="mt-12 text-[12px] text-stone-base/40">
          BAUST CSE FEST 2026
        </p>
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
