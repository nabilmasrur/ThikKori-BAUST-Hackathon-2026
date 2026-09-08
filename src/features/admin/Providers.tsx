import { useState } from 'react';
import { Badge, Button, Card, Input, Table, Td, Tr } from '@/components/ui';
import { TIER_ORDER } from '@/lib/constants';
import { useData } from '@/state/DataContext';
import { useToast } from '@/state/ToastContext';
import { useFmt } from '@/lib/useFmt';
import { areaName } from '@/lib/labels';
import type { Provider, TierName } from '@/types';

export function ProvidersAdmin() {
  const { db, adapter } = useData();
  const { push } = useToast();
  const { t, locale, taka, num, digits } = useFmt();
  const [q, setQ] = useState('');
  if (!db) return null;

  const rows = db.providers.filter(
    (p) =>
      !q ||
      p.business_name.toLowerCase().includes(q.toLowerCase()) ||
      p.name.toLowerCase().includes(q.toLowerCase()),
  );

  const shiftTier = async (p: Provider, delta: number) => {
    const idx = TIER_ORDER.indexOf(p.tier);
    const next = TIER_ORDER[Math.min(TIER_ORDER.length - 1, Math.max(0, idx + delta))] as TierName;
    if (next === p.tier) return;
    await adapter.update('providers', p.id, { tier: next });
    push(t('toast.providerUpdated'), 'success');
  };

  const toggle = async (p: Provider, patch: Partial<Provider>) => {
    await adapter.update('providers', p.id, patch);
    push(t('toast.providerUpdated'), 'success');
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[26px]">{t('admin.providersTitle')}</h1>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('common.search')}
          className="max-w-xs"
        />
      </div>

      <Card className="p-1">
        <Table
          head={[
            t('admin.provider'),
            t('admin.tier'),
            t('admin.rating'),
            t('admin.jobs'),
            t('admin.earnings'),
            t('common.status'),
            t('common.actions'),
          ]}
        >
          {rows.map((p) => (
            <Tr key={p.id}>
              <Td>
                <span className="block font-semibold">{p.business_name}</span>
                <span className="block text-[12px] text-ink-faint">
                  {p.name} · {areaName(p.base_area, locale)}
                </span>
              </Td>
              <Td>
                <Badge tone="amber">{t(`tier.${p.tier}`)}</Badge>
              </Td>
              <Td className="num">{digits(p.rating.toFixed(1))}</Td>
              <Td className="num">{num(p.completed_jobs_count)}</Td>
              <Td className="num">{taka(p.total_earnings)}</Td>
              <Td>
                {p.suspended ? (
                  <Badge tone="brick">{t('admin.suspended')}</Badge>
                ) : p.flagged_for_review ? (
                  <Badge tone="amber">{t('admin.flagged')}</Badge>
                ) : (
                  <Badge tone="sage">{t('admin.active')}</Badge>
                )}
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="quiet" onClick={() => void shiftTier(p, 1)}>
                    {t('admin.promote')}
                  </Button>
                  <Button size="sm" variant="quiet" onClick={() => void shiftTier(p, -1)}>
                    {t('admin.demote')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void toggle(p, { flagged_for_review: !p.flagged_for_review })}
                  >
                    {p.flagged_for_review ? t('admin.unflag') : t('admin.flag')}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void toggle(p, { suspended: !p.suspended })}>
                    {p.suspended ? t('admin.unsuspend') : t('admin.suspend')}
                  </Button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
