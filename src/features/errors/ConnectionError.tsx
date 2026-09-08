import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui';
import { IconAlert } from '@/components/Icons';
import { useFmt } from '@/lib/useFmt';

export function ConnectionError({ detail, onRetry }: { detail?: string; onRetry: () => void }) {
  const { t } = useFmt();
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-5 text-center">
      <Logo className="mb-8" />
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brick-wash text-brick">
        <IconAlert size={24} />
      </span>
      <h1 className="mt-4 font-display text-[24px]">{t('errors.connectionTitle')}</h1>
      <p className="mt-2 max-w-md text-[14px] text-ink-soft">{t('errors.connectionDesc')}</p>
      {detail && (
        <code className="mt-3 max-w-md break-all rounded-md border border-stone-line bg-stone-raised px-3 py-2 font-mono text-[11.5px] text-ink-faint">
          {detail}
        </code>
      )}
      <Button variant="accent" className="mt-6" onClick={onRetry}>
        {t('common.retry')}
      </Button>
    </main>
  );
}
