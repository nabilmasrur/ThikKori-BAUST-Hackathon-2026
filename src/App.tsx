import { Suspense, lazy } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { DataProvider, useData } from '@/state/DataContext';
import { SessionProvider, useSession } from '@/state/SessionContext';
import { ToastProvider } from '@/state/ToastContext';
import { Spinner } from '@/components/ui';
import { LanguageSelect } from '@/features/language/LanguageSelect';
import { UnifiedLogin } from '@/features/auth/UnifiedLogin';
import { NotFound } from '@/features/errors/NotFound';
import { ConnectionError } from '@/features/errors/ConnectionError';
import { WelcomePage } from '@/features/welcome/WelcomePage';
import { SignupPage } from '@/features/welcome/SignupPage';
import { PageTransition } from '@/components/PageTransition';

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
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><WelcomePage /></PageTransition>} />
          <Route path="/signup" element={<PageTransition><SignupPage /></PageTransition>} />
          <Route path="/language" element={<PageTransition><LanguageSelect /></PageTransition>} />
          <Route path="/login" element={<PageTransition><UnifiedLogin /></PageTransition>} />
          <Route path="/customer/*" element={<PageTransition><CustomerApp /></PageTransition>} />
          <Route path="/provider/*" element={<PageTransition><ProviderApp /></PageTransition>} />
          <Route path="/admin/*" element={<PageTransition><AdminApp /></PageTransition>} />
          <Route path="/pay/:token" element={<PageTransition><PayPage /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
