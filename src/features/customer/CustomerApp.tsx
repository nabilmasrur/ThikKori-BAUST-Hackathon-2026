import { Navigate, Route, Routes } from 'react-router-dom';
import { TopBar } from '@/components/TopBar';
import { CustomerLogin } from '@/features/auth/CustomerLogin';
import { NotFound } from '@/features/errors/NotFound';
import { useData } from '@/state/DataContext';
import { useSession } from '@/state/SessionContext';
import { useFmt } from '@/lib/useFmt';
import { areaName } from '@/lib/labels';
import { CustomerHome } from '@/features/customer/Home';
import { RequestWizard } from '@/features/customer/RequestWizard';
import { MatchResults } from '@/features/customer/MatchResults';
import { Tracking } from '@/features/customer/Tracking';
import { MyBookings } from '@/features/customer/Bookings';
import { Rewards } from '@/features/customer/Rewards';

export default function CustomerApp() {
  const { session } = useSession();
  const { db } = useData();
  const { t, locale } = useFmt();

  const customer = session?.role === 'customer' ? db?.customers.find((c) => c.id === session.id) : undefined;

  if (!customer) {
    return (
      <Routes>
        <Route path="login" element={<CustomerLogin />} />
        <Route path="*" element={<CustomerLogin />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-[100dvh]">
      <TopBar
        home="/customer"
        who={{ name: customer.name, sub: areaName(customer.area, locale) }}
        items={[
          { to: '/customer', label: t('nav.home'), end: true },
          { to: '/customer/bookings', label: t('nav.bookings') },
          { to: '/customer/rewards', label: t('nav.rewards') },
        ]}
      />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Routes>
          <Route index element={<CustomerHome customer={customer} />} />
          <Route path="login" element={<Navigate to="/customer" replace />} />
          <Route path="new" element={<RequestWizard customer={customer} />} />
          <Route path="match/:requestId" element={<MatchResults customer={customer} />} />
          <Route path="bookings" element={<MyBookings customer={customer} />} />
          <Route path="booking/:bookingId" element={<Tracking customer={customer} />} />
          <Route path="rewards" element={<Rewards customer={customer} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
