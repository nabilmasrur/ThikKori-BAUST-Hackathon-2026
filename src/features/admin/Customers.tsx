import { useState } from 'react';
import { Badge, Button, Card, Input, Table, Td, Tr } from '@/components/ui';
import { useData } from '@/state/DataContext';
import { useToast } from '@/state/ToastContext';
import { useFmt } from '@/lib/useFmt';
import { areaName } from '@/lib/labels';
import type { Customer } from '@/types';

export function CustomersAdmin() {
  const { db, adapter } = useData();
  const { push } = useToast();
  const { t, locale, num } = useFmt();
  const [q, setQ] = useState('');
  if (!db) return null;

  const rows = db.customers.filter(
    (c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q),
  );

  const act = async (c: Customer, patch: Partial<Customer>, message: string) => {
    await adapter.update('customers', c.id, patch);
    push(message, 'success');
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[26px]">{t('admin.customersTitle')}</h1>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('common.search')} className="max-w-xs" />
      </div>

      <Card className="p-1">
        <Table
          head={[
            t('admin.customer'),
            t('admin.trust'),
            t('nav.bookings'),
            t('admin.points'),
            t('common.status'),
            t('common.actions'),
          ]}
        >
          {rows.map((c) => {
            const bookings = db.bookings.filter((b) => b.customer_id === c.id).length;
            const loyalty = db.loyalty.find((l) => l.customer_id === c.id);
            return (
              <Tr key={c.id}>
                <Td>
                  <span className="block font-semibold">{c.name}</span>
                  <span className="num block text-[12px] text-ink-faint">
                    {c.phone} · {areaName(c.area, locale)}
                  </span>
                </Td>
                <Td className="num">{num(c.trust_score)}</Td>
                <Td className="num">{num(bookings)}</Td>
                <Td className="num">{num(loyalty?.points ?? 0)}</Td>
                <Td>
                  {c.suspended ? (
                    <Badge tone="brick">{t('admin.suspended')}</Badge>
                  ) : (
                    <Badge tone="sage">{t('admin.active')}</Badge>
                  )}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      variant="quiet"
                      onClick={() => void act(c, { trust_score: 80 }, t('toast.trustReset'))}
                    >
                      {t('admin.resetTrust')}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => void act(c, { suspended: !c.suspended }, t('toast.providerUpdated'))}
                    >
                      {c.suspended ? t('admin.unsuspend') : t('admin.suspend')}
                    </Button>
                  </div>
                </Td>
              </Tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
}
