import { useSession } from '@/state/SessionContext';
import { useFmt } from '@/lib/useFmt';
import { cn } from '@/lib/cn';

/** Always reachable, on every screen after the first choice. */
export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useSession();
  const { t } = useFmt();

  return (
    <div
      className="inline-flex rounded-lg border border-stone-line bg-stone-raised p-0.5"
      role="group"
      aria-label={t('a11y.changeLanguage')}
    >
      {(['bn', 'en'] as const).map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          className={cn(
            'rounded-[6px] font-semibold transition-colors',
            compact ? 'px-2 py-1 text-[12px]' : 'px-3 py-1.5 text-[13px]',
            locale === code ? 'bg-teal text-stone-base' : 'text-ink-soft hover:text-ink',
          )}
        >
          {code === 'bn' ? 'বাংলা' : 'EN'}
        </button>
      ))}
    </div>
  );
}
