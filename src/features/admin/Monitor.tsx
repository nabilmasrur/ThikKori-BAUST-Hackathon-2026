import { useState } from 'react';
import { Badge, Button, Card, Field, Modal, SectionTitle, Select, Table, Td, Textarea, Tr } from '@/components/ui';
import { STATUS_TONE } from '@/features/customer/statusTone';
import { TIME_WINDOWS } from '@/lib/constants';
import { freeSlots } from '@/lib/matching';
import { forceCancelBooking, reassignBooking } from '@/data/operations';
import { useData } from '@/state/DataContext';
import { useToast } from '@/state/ToastContext';
import { useFmt } from '@/lib/useFmt';
import { areaName, categoryName, shortRef } from '@/lib/labels';
import type { Booking } from '@/types';

export function Monitor() {
  const { db, adapter } = useData();
  const { push } = useToast();
  const { t, locale, taka, date, slot, dateTime } = useFmt();
  const [cancelFor, setCancelFor] = useState<Booking | null>(null);
  const [reason, setReason] = useState('');
  const [reassignFor, setReassignFor] = useState<Booking | null>(null);
  const [newProvider, setNewProvider] = useState('');

  if (!db) return null;

  const live = db.bookings
    .filter((b) => b.status !== 'completed' && b.status !== 'cancelled')
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const openRequests = db.requests
    .filter((r) => r.status === 'open' || r.status === 'matched')
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const alternatives = (booking: Booking) => {
    const req = db.requests.find((r) => r.id === booking.request_id);
    if (!req) return [];
    return db.providers.filter(
      (p) =>
        p.id !== booking.provider_id &&
        !p.suspended &&
        p.service_categories.includes(req.service_category_id) &&
        freeSlots(p, booking.confirmed_date, db.bookings, TIME_WINDOWS).includes(booking.confirmed_slot),
    );
  };

  const doCancel = async () => {
    if (!cancelFor) return;
    await forceCancelBooking(adapter, cancelFor, reason.trim() || 'cancelled_by_admin');
    setCancelFor(null);
    setReason('');
    push(t('toast.cancelled'), 'alert');
  };

  const doReassign = async () => {
    if (!reassignFor || !newProvider) return;
    await reassignBooking(adapter, reassignFor, newProvider);
    setReassignFor(null);
    setNewProvider('');
    push(t('toast.reassigned'), 'success');
  };

  return (
    <div className="grid gap-6">
      <h1 className="font-display text-[26px]">{t('admin.monitorTitle')}</h1>

      <Card className="p-1">
        <Table
          head={[
            t('admin.issueBooking'),
            t('wizard.step1'),
            t('admin.provider'),
            t('admin.customer'),
            t('common.time'),
            t('common.amount'),
            t('common.status'),
            t('common.actions'),
          ]}
        >
          {live.map((b) => {
            const req = db.requests.find((r) => r.id === b.request_id);
            const cat = db.service_categories.find((c) => c.id === req?.service_category_id);
            const prov = db.providers.find((p) => p.id === b.provider_id);
            const cust = db.customers.find((c) => c.id === b.customer_id);
            return (
              <Tr key={b.id}>
                <Td className="num text-[12px] text-ink-faint">{shortRef(b.id)}</Td>
                <Td className="font-semibold">{categoryName(cat, locale)}</Td>
                <Td>{prov?.business_name}</Td>
                <Td>{cust?.name}</Td>
                <Td className="num text-[12.5px]">
                  {date(b.confirmed_date)}
                  <span className="block text-ink-faint">{slot(b.confirmed_slot)}</span>
                </Td>
                <Td className="num">{taka(b.agreed_price)}</Td>
                <Td>
                  <Badge tone={STATUS_TONE[b.status]}>{t(`status.${b.status}`)}</Badge>
                </Td>
                <Td>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => setReassignFor(b)}>
                      {t('admin.reassign')}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setCancelFor(b)}>
                      {t('admin.forceCancel')}
                    </Button>
                  </div>
                </Td>
              </Tr>
            );
          })}
        </Table>
        {live.length === 0 && <p className="px-4 py-6 text-[13.5px] text-ink-soft">{t('home.activeNone')}</p>}
      </Card>

      <section>
        <SectionTitle title={t('admin.pendingRequests')} />
        <Card className="divide-y divide-stone-line">
          {openRequests.length === 0 && (
            <p className="px-4 py-6 text-[13.5px] text-ink-soft">{t('admin.noIssuesDesc')}</p>
          )}
          {openRequests.map((r) => {
            const cat = db.service_categories.find((c) => c.id === r.service_category_id);
            const cust = db.customers.find((c) => c.id === r.customer_id);
            const matches = db.request_matches.filter((m) => m.request_id === r.id).length;
            return (
              <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-[13px]">
                <span className="num w-[70px] shrink-0 text-ink-faint">{shortRef(r.id)}</span>
                <span className="min-w-0 flex-1 truncate font-semibold">{categoryName(cat, locale)}</span>
                <span className="truncate text-ink-soft">{cust?.name}</span>
                <span className="text-ink-soft">{areaName(r.area, locale)}</span>
                <span className="num text-ink-faint">{dateTime(r.created_at)}</span>
                <Badge tone={r.urgency === 'normal' ? 'neutral' : 'brick'}>{t(`urgency.${r.urgency}`)}</Badge>
                <Badge tone="teal">
                  {matches} {t('nav.providers')}
                </Badge>
              </div>
            );
          })}
        </Card>
      </section>

      <Modal
        open={Boolean(cancelFor)}
        onClose={() => setCancelFor(null)}
        title={t('admin.forceCancelTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelFor(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={() => void doCancel()}>
              {t('admin.forceCancel')}
            </Button>
          </>
        }
      >
        <Field label={t('common.reason')}>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </Modal>

      <Modal
        open={Boolean(reassignFor)}
        onClose={() => setReassignFor(null)}
        title={t('admin.reassignTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReassignFor(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="accent" disabled={!newProvider} onClick={() => void doReassign()}>
              {t('admin.reassign')}
            </Button>
          </>
        }
      >
        <p className="mb-3 text-[13px] text-ink-soft">{t('admin.reassignHint')}</p>
        {reassignFor && alternatives(reassignFor).length === 0 ? (
          <p className="text-[13.5px] font-semibold text-brick">{t('admin.noAlternatives')}</p>
        ) : (
          <Field label={t('admin.provider')}>
            <Select value={newProvider} onChange={(e) => setNewProvider(e.target.value)}>
              <option value="">—</option>
              {reassignFor &&
                alternatives(reassignFor).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.business_name} · {t(`tier.${p.tier}`)}
                  </option>
                ))}
            </Select>
          </Field>
        )}
      </Modal>
    </div>
  );
}
