import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useSession } from '@/state/SessionContext';
import { useFmt } from '@/lib/useFmt';
import { cn } from '@/lib/cn';
import { IconArrowLeft } from '@/components/Icons';

export interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

export function TopBar({
  items,
  who,
  home,
}: {
  items: NavItem[];
  who?: { name: string; sub?: string };
  home: string;
}) {
  const { signOut } = useSession();
  const { t } = useFmt();
  const navigate = useNavigate();

  return (
    <header className="no-print sticky top-0 z-40 border-b border-stone-line bg-stone-base/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-stone-deep hover:text-ink transition-colors"
          title={t('common.back') || 'Back'}
        >
          <IconArrowLeft size={20} />
        </button>
        <Link to={home} className="shrink-0">
          <Logo size="sm" />
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Primary">
          {items.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
                  isActive ? 'bg-teal-wash text-teal' : 'text-ink-soft hover:bg-stone-deep hover:text-ink',
                )
              }
            >
              {i.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {who && (
            <span className="hidden text-right leading-tight sm:block">
              <span className="block text-[13px] font-semibold text-ink">{who.name}</span>
              {who.sub && <span className="block text-[11px] text-ink-faint">{who.sub}</span>}
            </span>
          )}
          <LanguageToggle compact />
          <button
            type="button"
            onClick={signOut}
            className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-ink-soft hover:bg-stone-deep hover:text-ink"
          >
            {t('auth.signOut')}
          </button>
        </div>
      </div>

      {/* Mobile: the same destinations as a scrollable strip. */}
      <nav className="flex gap-1 overflow-x-auto border-t border-stone-line px-3 py-1.5 md:hidden" aria-label="Primary">
        {items.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.end}
            className={({ isActive }) =>
              cn(
                'whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-semibold',
                isActive ? 'bg-teal-wash text-teal' : 'text-ink-soft',
              )
            }
          >
            {i.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
