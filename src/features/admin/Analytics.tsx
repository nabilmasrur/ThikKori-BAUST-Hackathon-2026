import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, SectionTitle } from '@/components/ui';
import { requestsPerDay, revenueByMonth } from '@/features/admin/metrics';
import { TIER_ORDER } from '@/lib/constants';
import { useData } from '@/state/DataContext';
import { useFmt } from '@/lib/useFmt';
import { categoryName } from '@/lib/labels';
import { monthLabel } from '@/lib/format';

const TEAL = '#1D4B4A';
const AMBER = '#D98C2B';

const axis = { fontSize: 11, fill: '#5A554C' };
const tooltip = {
  background: '#FAF9F6',
  border: '1px solid #DEDCD3',
  borderRadius: 8,
  fontSize: 12,
} as const;

export function Analytics() {
  const { db } = useData();
  const { t, locale, taka } = useFmt();
  if (!db) return null;

  const perDay = requestsPerDay(db, 30);
  const byCategory = db.service_categories
    .map((c) => ({
      name: categoryName(c, locale),
      count: db.bookings.filter((b) => {
        const r = db.requests.find((x) => x.id === b.request_id);
        return r?.service_category_id === c.id;
      }).length,
    }))
    .sort((a, b) => b.count - a.count);
  const revenue = revenueByMonth(db, 6).map((r) => ({
    label: monthLabel(r.monthIndex, locale),
    revenue: r.revenue,
  }));
  const tiers = TIER_ORDER.map((tier) => ({
    name: t(`tier.${tier}`),
    count: db.providers.filter((p) => p.tier === tier).length,
  }));

  return (
    <div className="grid gap-5">
      <h1 className="font-display text-[26px]">{t('admin.analyticsTitle')}</h1>

      <Card className="p-5">
        <SectionTitle title={t('admin.requestsPerDay')} />
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={perDay} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
              <CartesianGrid stroke="#DEDCD3" vertical={false} />
              <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltip} />
              <Line type="monotone" dataKey="count" stroke={TEAL} strokeWidth={2} dot={false} name={t('nav.jobs')} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title={t('admin.bookingsByCategory')} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 8 }}>
                <CartesianGrid stroke="#DEDCD3" horizontal={false} />
                <XAxis type="number" tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ ...axis, fontSize: 10 }} width={110} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltip} cursor={{ fill: '#E6E4DB' }} />
                <Bar dataKey="count" fill={TEAL} radius={[0, 3, 3, 0]} name={t('nav.bookings')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle title={t('admin.revenueTrend')} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenue} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid stroke="#DEDCD3" vertical={false} />
                <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} width={60} />
                <Tooltip contentStyle={tooltip} formatter={(v: number) => taka(v)} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={AMBER}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: AMBER }}
                  name={t('admin.revenue')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle title={t('admin.tierDistribution')} />
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tiers} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
              <CartesianGrid stroke="#DEDCD3" vertical={false} />
              <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
              <YAxis tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltip} cursor={{ fill: '#E6E4DB' }} />
              <Bar dataKey="count" fill={AMBER} radius={[3, 3, 0, 0]} name={t('nav.providers')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
