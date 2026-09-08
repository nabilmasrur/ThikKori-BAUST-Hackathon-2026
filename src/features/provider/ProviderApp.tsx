import { Navigate, Route, Routes } from 'react-router-dom';
import { TopBar } from '@/components/TopBar';
import { ProviderLogin } from '@/features/auth/ProviderLogin';
import { NotFound } from '@/features/errors/NotFound';
import { useData } from '@/state/DataContext';
import { useSession } from '@/state/SessionContext';
import { useFmt } from '@/lib/useFmt';
import { ProviderDashboard } from '@/features/provider/Dashboard';
import { JobDetail } from '@/features/provider/JobDetail';
import { Finances } from '@/features/provider/Finances';
import { Growth } from '@/features/provider/Growth';

export default function ProviderApp() {
  const { session } = useSession();
  const { db } = useData();
  const { t } = useFmt();

  const provider = session?.role === 'provider' ? db?.providers.find((p) => p.id === session.id) : undefined;

  if (!provider) {
    return <Navigate to="/login?role=provider" replace />;
  }

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-transparent">
      <TopBar
        home="/provider"
        who={{ name: provider.business_name, sub: t('nav.provider') }}
        items={[
          { to: '/provider', label: t('nav.dashboard'), end: true },
          { to: '/provider/finances', label: t('nav.finances') },
          { to: '/provider/growth', label: t('nav.growth') },
        ]}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 w-full flex-1">
        <Routes>
          <Route index element={<ProviderDashboard provider={provider} />} />
          <Route path="login" element={<Navigate to="/provider" replace />} />
          <Route path="job/:bookingId" element={<JobDetail provider={provider} />} />
          <Route path="finances" element={<Finances provider={provider} />} />
          <Route path="growth" element={<Growth provider={provider} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
