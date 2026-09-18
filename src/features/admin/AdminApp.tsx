import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { NotFound } from '@/features/errors/NotFound';
import { useSession } from '@/state/SessionContext';
import { useData } from '@/state/DataContext';
import { useFmt } from '@/lib/useFmt';
import { cn } from '@/lib/cn';
import {
  IconAlert,
  IconChart,
  IconGrid,
  IconInbox,
  IconMegaphone,
  IconUsers,
  IconWrench,
} from '@/components/Icons';
import { Overview } from '@/features/admin/Overview';
import { ProvidersAdmin } from '@/features/admin/Providers';
import { CustomersAdmin } from '@/features/admin/Customers';
import { Monitor } from '@/features/admin/Monitor';
import { CategoriesAdmin } from '@/features/admin/Categories';
import { Issues } from '@/features/admin/Issues';
import { Analytics } from '@/features/admin/Analytics';
import { Announcements } from '@/features/admin/Announcements';
import { SignupRequests } from '@/features/admin/SignupRequests';

export default function AdminApp() {
  const { session, signOut } = useSession();
  const { db } = useData();
  const { t } = useFmt();

  if (session?.role !== 'admin') {
    return <Navigate to="/login?role=admin" replace />;
  }

  const pendingSignups = db?.signup_requests.filter((r) => r.status === 'pending').length ?? 0;

  const nav = [
    { to: '/admin', end: true, label: t('nav.overview'), icon: <IconGrid size={18} /> },
    { to: '/admin/signups', label: `Signups${pendingSignups > 0 ? ` (${pendingSignups})` : ''}`, icon: <IconUsers size={18} /> },
    { to: '/admin/monitor', label: t('nav.monitor'), icon: <IconInbox size={18} /> },
    { to: '/admin/providers', label: t('nav.providers'), icon: <IconWrench size={18} /> },
    { to: '/admin/customers', label: t('nav.customers'), icon: <IconUsers size={18} /> },
    { to: '/admin/categories', label: t('nav.categories'), icon: <IconGrid size={18} /> },
    { to: '/admin/issues', label: t('nav.issues'), icon: <IconAlert size={18} /> },
    { to: '/admin/analytics', label: t('nav.analytics'), icon: <IconChart size={18} /> },
    { to: '/admin/announcements', label: t('nav.announce'), icon: <IconMegaphone size={18} /> },
  ];

  return (
    <div className="min-h-[100dvh] md:flex">
      {/* Fixed sidebar on desktop. */}
      <aside className="no-print hidden w-60 shrink-0 border-r border-stone-line bg-stone-raised md:sticky md:top-0 md:block md:h-[100dvh]">
        <div className="border-b border-stone-line px-4 py-4">
          <Logo size="sm" />
          <p className="mt-1 text-[11px] font-semibold text-ink-faint">{t('admin.title')}</p>
        </div>
        <nav className="grid gap-0.5 p-2" aria-label="Admin">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-semibold',
                  isActive ? 'bg-teal text-stone-base' : 'text-ink-soft hover:bg-stone-deep hover:text-ink',
                )
              }
            >
              {n.icon}
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto grid gap-2 p-3">
          <LanguageToggle compact />
          <button
            type="button"
            onClick={signOut}
            className="rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-ink-soft hover:bg-stone-deep"
          >
            {t('auth.signOut')}
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="no-print flex items-center justify-between border-b border-stone-line px-4 py-3 md:hidden">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <LanguageToggle compact />
            <button type="button" onClick={signOut} className="text-[13px] font-semibold text-ink-soft">
              {t('auth.signOut')}
            </button>
          </div>
        </header>

        <main className="px-4 py-6 pb-24 md:px-7 md:pb-8">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="login" element={<Navigate to="/admin" replace />} />
            <Route path="signups" element={<SignupRequests />} />
            <Route path="monitor" element={<Monitor />} />
            <Route path="providers" element={<ProvidersAdmin />} />
            <Route path="customers" element={<CustomersAdmin />} />
            <Route path="categories" element={<CategoriesAdmin />} />
            <Route path="issues" element={<Issues />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>

      {/* Bottom tab bar on mobile. */}
      <nav
        className="no-print fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-stone-line bg-stone-raised md:hidden"
        aria-label="Admin"
      >
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              cn(
                'flex min-w-[76px] flex-1 flex-col items-center gap-0.5 px-2 py-2 text-[10.5px] font-semibold',
                isActive ? 'text-teal' : 'text-ink-faint',
              )
            }
          >
            {n.icon}
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
