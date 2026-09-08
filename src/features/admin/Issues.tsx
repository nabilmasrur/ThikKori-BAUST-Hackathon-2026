import { useState } from 'react';
import { Badge, Button, Card, EmptyState, Field, Modal, Textarea } from '@/components/ui';
import { IconAlert } from '@/components/Icons';
import { useData } from '@/state/DataContext';
import { useToast } from '@/state/ToastContext';
import { useFmt } from '@/lib/useFmt';
import { categoryName, shortRef } from '@/lib/labels';
import type { IssueStatus, ReportedIssue } from '@/types';

const TONE: Record<IssueStatus, 'brick' | 'amber' | 'sage'> = {
  open: 'brick',
  escalated: 'amber',
  resolved: 'sage',
};

export function Issues() {
  const { db, adapter } = useData();
  const { push } = useToast();
  const { t, locale, taka, dateTime } = useFmt();
  const [noteFor, setNoteFor] = useState<ReportedIssue | null>(null);
  const [note, setNote] = useState('');

  if (!db) return null;
  const issues = [...db.reported_issues].sort((a, b) => b.created_at.localeCompare(a.created_at));

  const resolve = async (issue: ReportedIssue, status: IssueStatus, adminNote?: string) => {
    await adapter.update('reported_issues', issue.id, {
      status,
      admin_note: adminNote ?? issue.admin_note,
    });
    push(status === 'resolved' ? t('toast.issueResolved') : t('toast.issueEscalated'), 'success');
  };

  /** A refund credit is recorded as loyalty points on the customer's account. */
  const refund = async (issue: ReportedIssue) => {
    const booking = db.bookings.find((b) => b.id === issue.booking_id);
    const loyalty = db.loyalty.find((l) => l.customer_id === issue.reported_by_customer_id);
    const credit = Math.round((booking?.agreed_price ?? 0) / 10);
    if (loyalty) {
      await adapter.update('loyalty', loyalty.customer_id, { points: loyalty.points + credit });
    } else {
      await adapter.insert('loyalty', [
        {
          customer_id: issue.reported_by_customer_id,
          points: credit,
          rated_bookings: 0,
          coupons_unlocked: [],
        },
      ]);
    }
    await resolve(issue, 'resolved', `refund_credit:${credit}`);
  };

  if (issues.length === 0) {
    return (
      <div className="grid gap-4">
        <h1 className="font-display text-[26px]">{t('admin.issuesTitle')}</h1>
        <EmptyState icon={<IconAlert size={22} />} title={t('admin.noIssues')} description={t('admin.noIssuesDesc')} />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <h1 className="font-display text-[26px]">{t('admin.issuesTitle')}</h1>

      <div className="grid gap-2.5">
        {issues.map((issue) => {
          const booking = db.bookings.find((b) => b.id === issue.booking_id);
          const req = db.requests.find((r) => r.id === booking?.request_id);
          const cat = db.service_categories.find((c) => c.id === req?.service_category_id);
          const customer = db.customers.find((c) => c.id === issue.reported_by_customer_id);
          const provider = db.providers.find((p) => p.id === booking?.provider_id);
          return (
            <Card key={issue.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={TONE[issue.status]}>{t(`admin.${issue.status === 'open' ? 'active' : issue.status}`)}</Badge>
                <span className="num text-[12px] text-ink-faint">{shortRef(issue.booking_id)}</span>
                <span className="text-[13px] font-semibold">{categoryName(cat, locale)}</span>
                <span className="num ml-auto text-[12px] text-ink-faint">{dateTime(issue.created_at)}</span>
              </div>
              <p className="mt-2 text-[13.5px]">{issue.reason}</p>
              <p className="mt-1.5 text-[12.5px] text-ink-soft">
                {customer?.name} · {provider?.business_name} · {taka(booking?.agreed_price ?? 0)}
              </p>
              {issue.admin_note && (
                <p className="num mt-2 rounded-md bg-stone-base/70 px-3 py-2 font-mono text-[12px] text-ink-soft">
                  {issue.admin_note}
                </p>
              )}
              {issue.status !== 'resolved' && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Button
                    size="sm"
                    variant="quiet"
                    onClick={() => {
                      setNoteFor(issue);
                      setNote('');
                    }}
                  >
                    {t('admin.resolve')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void resolve(issue, 'escalated')}>
                    {t('admin.escalate')}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void refund(issue)}>
                    {t('admin.refund')}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Modal
        open={Boolean(noteFor)}
        onClose={() => setNoteFor(null)}
        title={t('admin.resolve')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setNoteFor(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="accent"
              onClick={() => {
                if (noteFor) void resolve(noteFor, 'resolved', note.trim() || '—');
                setNoteFor(null);
              }}
            >
              {t('admin.resolve')}
            </Button>
          </>
        }
      >
        <Field label={t('admin.adminNote')}>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </Modal>
    </div>
  );
}
