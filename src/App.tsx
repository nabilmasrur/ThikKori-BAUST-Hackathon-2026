import { Suspense, lazy } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { DataProvider, useData } from '@/state/DataContext';
import { SessionProvider, useSession } from '@/state/SessionContext';
import { ToastProvider } from '@/state/ToastContext';
import { Spinner } from '@/components/ui';
import { LanguageSelect } from '@/features/language/LanguageSelect';
import { PanelSelect } from '@/features/panels/PanelSelect';
import { NotFound } from '@/features/errors/NotFound';
import { ConnectionError } from '@/features/errors/ConnectionError';
import { WelcomePage } from '@/features/welcome/WelcomePage';
import { SignupPage } from '@/features/welcome/SignupPage';

// Each panel is its own bundle — the customer never downloads the admin app.
const CustomerApp = lazy(() => import('@/features/customer/CustomerApp'));
const ProviderApp = lazy(() => import('@/features/provider/ProviderApp'));
const AdminApp = lazy(() => import('@/features/admin/AdminApp'));
const PayPage = lazy(() => import('@/features/invoice/PayPage'));

export default function App() {
  return (
    <SessionProvider>
      <ToastProvider>
        <DataProvider>
          <Shell />
        </DataProvider>
      </ToastProvider>
    </SessionProvider>
  );
}

function Shell() {
  const { loading, error, db, refresh } = useData();
  const { localeChosen } = useSession();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (error || !db) return <ConnectionError detail={error?.message} onRetry={() => void refresh()} />;

  // The language screen is the very first thing, before any panel.
  if (!localeChosen && !location.pathname.startsWith('/pay/')) return <LanguageSelect />;

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/language" element={<LanguageSelect />} />
        <Route path="/panels" element={<PanelSelect />} />
        <Route path="/customer/*" element={<CustomerApp />} />
        <Route path="/provider/*" element={<ProviderApp />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/pay/:token" element={<PayPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
