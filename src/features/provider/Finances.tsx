import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge, Button, Card, EmptyState, Field, Input, Modal, SectionTitle, Select, Stat } from '@/components/ui';
import { IconPlus, IconTaka, IconTruck } from '@/components/Icons';
import { logCost } from '@/data/operations';
import { useData } from '@/state/DataContext';
import { useToast } from '@/state/ToastContext';
import { useFmt } from '@/lib/useFmt';
import { maskName, monthKey, monthLabel, todayISO } from '@/lib/format';
import { categoryName } from '@/lib/labels';
import { cn } from '@/lib/cn';
import type { CostCategory, Provider } from '@/types';

const COST_TONE: Record<CostCategory, 'teal' | 'amber' | 'sage' | 'neutral'> = {
  tools: 'teal',
  transport: 'amber',
  materials: 'sage',
  other: 'neutral',
};

export function Finances({ provider }: { provider: Provider }) {
  const { db, adapter } = useData();
  const { push } = useToast();
  const { t, locale, taka, date } = useFmt();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'transport' as CostCategory,
    date: todayISO(),
    booking_id: '',
  });
  const [error, setError] = useState('');

  const paid = useMemo(
    () =>
      (db?.invoices ?? [])
        .filter((i) => i.provider_id === provider.id && i.payment_status === 'paid')
        .sort((a, b) => (b.paid_at ?? '').localeCompare(a.paid_at ?? '')),
    [db, provider.id],
  );
  const costs = useMemo(
    () =>
      (db?.provider_costs ?? [])
        .filter((c) => c.provider_id === provider.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [db, provider.id],
  );

  const thisMonth = monthKey(new Date().toISOString());
  const earnedMonth = paid
    .filter((i) => monthKey(i.paid_at ?? '') === thisMonth)
    .reduce((s, i) => s + i.subtotal, 0);
  const earnedAll = paid.reduce((s, i) => s + i.subtotal, 0);
  const costsMonth = costs.filter((c) => monthKey(c.date) === thisMonth).reduce((s, c) => s + c.amount, 0);
  const net = earnedMonth - costsMonth;

  const pending = (db?.bookings ?? [])
    .filter(
      (b) =>
        b.provider_id === provider.id &&
        (b.status === 'accepted' || b.status === 'on_the_way' || b.status === 'in_progress'),
    )
    .reduce((s, b) => s + b.agreed_price, 0);

  // Six grouped bars — earnings against costs, nothing more.
  const chart = useMemo(() => {
    const out: { label: string; earnings: number; costs: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      out.push({
        label: monthLabel(d.getMonth(), locale),
        earnings: paid.filter((x) => monthKey(x.paid_at ?? '') === key).reduce((s, x) => s + x.subtotal, 0),
        costs: costs.filter((c) => monthKey(c.date) === key).reduce((s, c) => s + c.amount, 0),
      });
    }
    return out;
  }, [paid, costs, locale]);

  const save = async () => {
    const amount = Number(form.amount);
    if (!form.description.trim()) return setError(t('errors.formRequired'));
    if (!Number.isFinite(amount) || amount <= 0) return setError(t('errors.amountInvalid'));
    await logCost(adapter, {
      provider_id: provider.id,
      description: form.description.trim(),
      amount: Math.round(amount),
      category: form.category,
      date: form.date,
      booking_id: form.booking_id || null,
    });
    setOpen(false);
    setForm({ description: '', amount: '', category: 'transport', date: todayISO(), booking_id: '' });
    setError('');
    push(t('toast.costLogged'), 'success');
  };

  if (!db) return null;

  return (
    <div className="grid gap-6">
      <h1 className="font-display text-[24px]">{t('finances.title')}</h1>

      {/* Net income leads: one number, one colour decision. */}
      <Card className={cn('p-6', net >= 0 ? 'border-sage/40 bg-sage-wash' : 'border-brick/40 bg-brick-wash')}>
        <p className="text-[13px] font-semibold text-ink-soft">{t('finances.net')}</p>
        <p
          className={cn(
            'num mt-1 font-display text-[44px] leading-none sm:text-[54px]',
            net >= 0 ? 'text-sage' : 'text-brick',
          )}
        >
          {taka(net)}
        </p>
        <p className="mt-2 text-[13px] text-ink-soft">
          {t('finances.netDesc', { month: monthLabel(new Date().getMonth(), locale) })}
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t('finances.earnedMonth')} value={taka(earnedMonth)} icon={<IconTaka size={18} />} />
        <Stat label={t('finances.earnedAll')} value={taka(earnedAll)} />
        <Stat label={t('finances.pending')} value={taka(pending)} hint={t('finances.pendingDesc')} />
        <Stat label={t('finances.costsMonth')} value={taka(costsMonth)} tone="brick" icon={<IconTruck size={18} />} />
      </div>

      <Card className="p-5">
        <SectionTitle title={t('finances.chart')} />
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 4, right: 8, bottom: 0, left: -14 }}>
              <CartesianGrid stroke="#DEDCD3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#5A554C' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8B857A' }} axisLine={false} tickLine={false} width={56} />
              <Tooltip
                cursor={{ fill: '#E6E4DB' }}
                contentStyle={{
                  background: '#FAF9F6',
                  border: '1px solid #DEDCD3',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => taka(v)}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
              <Bar dataKey="earnings" name={t('finances.chartEarnings')} fill="#1D4B4A" radius={[3, 3, 0, 0]} />
              <Bar dataKey="costs" name={t('finances.chartCosts')} fill="#D98C2B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle title={t('finances.perJob')} />
          {paid.length === 0 ? (
            <EmptyState title={t('finances.noEarnings')} description={t('finances.noEarningsDesc')} />
          ) : (
            <div className="grid gap-2">
              {paid.slice(0, 12).map((inv) => {
                const booking = db.bookings.find((b) => b.id === inv.booking_id);
                const req = db.requests.find((r) => r.id === booking?.request_id);
                const cat = db.service_categories.find((c) => c.id === req?.service_category_id);
                const cust = db.customers.find((c) => c.id === inv.customer_id);
                return (
                  <Card key={inv.id} className="flex items-center gap-3 p-3.5">
                    <span className="num w-[86px] shrink-0 text-[12px] text-ink-faint">
                      {date(inv.paid_at ?? inv.generated_at)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold">{categoryName(cat, locale)}</span>
                      <span className="block truncate text-[12px] text-ink-faint">
                        {cust ? maskName(cust.name) : ''}
                      </span>
                    </span>
                    <span className="num shrink-0 text-[14px] font-semibold text-sage">{taka(inv.subtotal)}</span>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <SectionTitle
            title={t('finances.costs')}
            action={
              <Button variant="accent" size="sm" onClick={() => setOpen(true)}>
                <IconPlus size={15} />
                {t('finances.logCost')}
              </Button>
            }
          />
          {costs.length === 0 ? (
            <EmptyState title={t('finances.noCosts')} description={t('finances.noCostsDesc')} />
          ) : (
            <div className="grid gap-2">
              {costs.slice(0, 12).map((c) => (
                <Card key={c.id} className="flex items-center gap-3 p-3.5">
                  <span className="num w-[86px] shrink-0 text-[12px] text-ink-faint">{date(c.date)}</span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px]">{c.description}</span>
                  <Badge tone={COST_TONE[c.category]}>{t(`cost.${c.category}`)}</Badge>
                  <span className="num shrink-0 text-[14px] font-semibold text-brick">−{taka(c.amount)}</span>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('finances.logCostTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="accent" onClick={() => void save()}>
              {t('common.save')}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Field label={t('finances.description')} error={error || undefined}>
            <Input
              value={form.description}
              placeholder={t('finances.descriptionPlaceholder')}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('common.amount')}>
              <Input
                inputMode="numeric"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
            <Field label={t('finances.category')}>
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as CostCategory })}
              >
                {(['tools', 'transport', 'materials', 'other'] as const).map((c) => (
                  <option key={c} value={c}>
                    {t(`cost.${c}`)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('common.date')}>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label={t('finances.linkBooking')}>
              <Select value={form.booking_id} onChange={(e) => setForm({ ...form, booking_id: e.target.value })}>
                <option value="">{t('finances.noBooking')}</option>
                {db.bookings
                  .filter((b) => b.provider_id === provider.id)
                  .slice(0, 25)
                  .map((b) => {
                    const req = db.requests.find((r) => r.id === b.request_id);
                    const cat = db.service_categories.find((c) => c.id === req?.service_category_id);
                    return (
                      <option key={b.id} value={b.id}>
                        {date(b.confirmed_date)} — {categoryName(cat, locale)}
                      </option>
                    );
                  })}
              </Select>
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
