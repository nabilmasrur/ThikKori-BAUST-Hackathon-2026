import { useState } from 'react';
import { Badge, Button, Card, Table, Td, Tr } from '@/components/ui';
import { useData } from '@/state/DataContext';
import { useToast } from '@/state/ToastContext';
import { approveSignupRequest, rejectSignupRequest } from '@/data/operations';
import type { SignupRequest } from '@/types';

const STATUS_TONE = {
  pending: 'amber',
  approved: 'sage',
  rejected: 'brick',
} as const;

export function SignupRequests() {
  const { db, adapter } = useData();
  const { push } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  if (!db) return null;

  const rows = [...db.signup_requests]
    .filter((r) => filter === 'all' || r.status === filter)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const approve = async (req: SignupRequest) => {
    setBusy(req.id);
    let assignedCats: string[] | undefined = undefined;

    if (req.role === 'provider') {
      const allCats = db.service_categories.map(c => c.id).join(', ');
      const cat = prompt(`Assign category for ${req.profession}. Available: ${allCats}`);
      if (cat) {
        assignedCats = [cat.trim()];
      } else {
        setBusy(null);
        return; // Cancelled
      }
    }

    try {
      await approveSignupRequest(adapter, db, req.id, assignedCats);
      push(`✅ ${req.name} approved — account created.`, 'success');
    } catch {
      push('Failed to approve. Please try again.', 'alert');
    } finally {
      setBusy(null);
    }
  };

  const reject = async (req: SignupRequest) => {
    setBusy(req.id);
    try {
      await rejectSignupRequest(adapter, req.id);
      push(`❌ ${req.name}'s request rejected.`, 'alert');
    } finally {
      setBusy(null);
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('en-BD', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="grid gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px]">Signup Requests</h1>
          <p className="text-[13px] text-ink-soft mt-0.5">
            Review and approve/reject new account requests from customers and providers.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors capitalize ${
                filter === f
                  ? 'bg-teal text-stone-base'
                  : 'bg-stone-raised border border-stone-line text-ink-soft hover:text-ink'
              }`}
            >
              {f}
              {f === 'pending' && db.signup_requests.filter((r) => r.status === 'pending').length > 0 && (
                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber text-[10px] text-white font-bold">
                  {db.signup_requests.filter((r) => r.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <Card className="p-10 text-center text-ink-soft">
          <p className="text-2xl">📭</p>
          <p className="mt-3 font-semibold">No {filter} requests</p>
          <p className="mt-1 text-[13px]">
            {filter === 'pending'
              ? 'All signup requests have been reviewed.'
              : `No ${filter} requests to show.`}
          </p>
        </Card>
      ) : (
        <Card className="p-1">
          <Table
            head={['Name', 'Role', 'Email', 'Phone', 'Profession', 'Submitted', 'Status', 'Actions']}
          >
            {rows.map((req) => (
              <Tr key={req.id}>
                <Td>
                  <span className="font-semibold text-ink">{req.name}</span>
                </Td>
                <Td>
                  <Badge tone={req.role === 'customer' ? 'teal' : 'amber'}>
                    {req.role === 'customer' ? 'Customer' : 'Provider'}
                  </Badge>
                </Td>
                <Td>
                  <span className="text-[13px]">{req.email}</span>
                </Td>
                <Td>
                  <span className="text-[13px] font-mono">{req.phone}</span>
                </Td>
                <Td>
                  <span className="text-[13px] text-ink-soft">
                    {req.profession || '—'}
                  </span>
                </Td>
                <Td>
                  <span className="text-[12px] text-ink-soft">{fmtDate(req.created_at)}</span>
                </Td>
                <Td>
                  <Badge tone={STATUS_TONE[req.status]}>
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </Badge>
                </Td>
                <Td>
                  {req.status === 'pending' ? (
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={busy === req.id}
                        onClick={() => void approve(req)}
                      >
                        {busy === req.id ? '…' : 'Approve'}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busy === req.id}
                        onClick={() => void reject(req)}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-[12px] text-ink-faint">
                      {req.reviewed_at ? fmtDate(req.reviewed_at) : '—'}
                    </span>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        </Card>
      )}
    </div>
  );
}
