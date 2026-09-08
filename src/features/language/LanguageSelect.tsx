import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/Logo';
import { useSession } from '@/state/SessionContext';
import type { Locale } from '@/types';

/**
 * The first screen in the product. No navigation, no login, one decision.
 * Deep teal ground so the choice feels like a doorway rather than a form.
 */
export function LanguageSelect() {
  const { setLocale } = useSession();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const choose = (locale: Locale) => {
    setLocale(locale);
    navigate('/', { replace: true });
  };

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-teal-deep px-5 py-12">
      <Sheen />

      <div className="relative z-10 w-full max-w-3xl">
        <div className="mb-10 text-center">
          <Logo size="lg" onDark className="justify-center" />
          <p lang="bn" className="mt-4 font-display text-[22px] text-amber sm:text-[26px]">
            ঘরের কাজ, ঠিক সময়ে
          </p>
          <p className="mt-1.5 text-[14px] text-stone-base/65">Home services in Dhaka, arranged end to end</p>
        </div>

        <h1 className="mb-1 text-center font-display text-[19px] font-semibold text-stone-base">
          {t('lang.title')} <span className="text-stone-base/50">·</span>{' '}
          <span lang="bn">আপনার ভাষা বেছে নিন</span>
        </h1>
        <p className="mb-7 text-center text-[13px] text-stone-base/55">{t('lang.subtitle')}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Choice
            lang="bn"
            script="বাংলা"
            roman="Bengali"
            sample="সেবার অনুরোধ · অবস্থা দেখুন · চালান"
            onClick={() => choose('bn')}
          />
          <Choice
            lang="en"
            script="English"
            roman="ইংরেজি"
            sample="Request · Track status · Invoice"
            onClick={() => choose('en')}
          />
        </div>

        <p className="mt-8 text-center text-[12px] text-stone-base/45">
          BAUST CSE FEST 2026 · Smart Home Service Automation
        </p>
      </div>
    </main>
  );
}

function Choice({
  lang,
  script,
  roman,
  sample,
  onClick,
}: {
  lang: string;
  script: string;
  roman: string;
  sample: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      lang={lang}
      className="group animate-rise rounded-2xl border border-stone-base/15 bg-stone-raised p-6 text-left transition-transform duration-200 hover:-translate-y-0.5 focus-visible:-translate-y-0.5 sm:p-7"
    >
      <span className="block font-display text-[34px] leading-tight text-ink sm:text-[40px]">{script}</span>
      <span className="mt-0.5 block text-[13px] font-medium text-ink-faint">{roman}</span>
      <span className="mt-5 block h-px w-full bg-stone-line" />
      <span className="mt-4 flex items-center justify-between gap-3">
        <span className="text-[12.5px] leading-snug text-ink-soft">{sample}</span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber text-ink transition-colors group-hover:bg-teal group-hover:text-stone-base">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
    </button>
  );
}

/** A single quiet light source, not a gradient wash. */
function Sheen() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute -left-24 top-1/3 h-[420px] w-[420px] rounded-full bg-teal-soft/20 blur-[90px]" />
      <div className="absolute right-0 top-0 h-40 w-40 border-b border-l border-amber/20" />
      <div className="absolute bottom-0 left-0 h-40 w-40 border-r border-t border-amber/15" />
    </div>
  );
}
