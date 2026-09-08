import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui';
import { useFmt } from '@/lib/useFmt';

export function NotFound() {
  const { t } = useFmt();
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-5 text-center">
      <Logo className="mb-8" />
      <p className="num font-display text-[56px] leading-none text-teal/25">404</p>
      <h1 className="mt-3 font-display text-[24px]">{t('errors.notFoundTitle')}</h1>
      <p className="mt-2 max-w-sm text-[14px] text-ink-soft">{t('errors.notFoundDesc')}</p>
      <Link to="/panels" className="mt-6">
        <Button variant="accent">{t('errors.goHome')}</Button>
      </Link>
    </main>
  );
}
