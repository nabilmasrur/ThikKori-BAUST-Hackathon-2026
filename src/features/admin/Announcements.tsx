import { useState } from 'react';
import { Badge, Button, Card, Field, SectionTitle, Select, Textarea } from '@/components/ui';
import { IconMegaphone } from '@/components/Icons';
import { broadcastAnnouncement } from '@/data/operations';
import { useData } from '@/state/DataContext';
import { useToast } from '@/state/ToastContext';
import { useFmt } from '@/lib/useFmt';
import { cn } from '@/lib/cn';
import type { AnnouncementTarget } from '@/types';

export function Announcements() {
  const { db, adapter } = useData();
  const { push } = useToast();
  const { t, dateTime } = useFmt();
  const [target, setTarget] = useState<AnnouncementTarget>('providers');
  const [message, setMessage] = useState('');
  const [messageBn, setMessageBn] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'urgent'>('normal');

  if (!db) return null;
  const history = [...db.admin_announcements].sort((a, b) => b.sent_at.localeCompare(a.sent_at));

  const send = async () => {
    if (!message.trim()) return;
    await broadcastAnnouncement(adapter, {
      target_role: target,
      message: message.trim(),
      message_bn: messageBn.trim() || message.trim(),
      urgency,
    });
    setMessage('');
    setMessageBn('');
    push(t('admin.sent', { target: t(`admin.target${target === 'all' ? 'All' : target === 'customers' ? 'Customers' : 'Providers'}`) }), 'success');
  };

  return (
    <div className="grid gap-5">
      <h1 className="font-display text-[26px]">{t('admin.announceTitle')}</h1>

      <Card className="p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('admin.target')}>
            <Select value={target} onChange={(e) => setTarget(e.target.value as AnnouncementTarget)}>
              <option value="all">{t('admin.targetAll')}</option>
              <option value="customers">{t('admin.targetCustomers')}</option>
              <option value="providers">{t('admin.targetProviders')}</option>
            </Select>
          </Field>
          <Field label={t('urgency.label')}>
            <Select value={urgency} onChange={(e) => setUrgency(e.target.value as 'normal' | 'urgent')}>
              <option value="normal">{t('urgency.normal')}</option>
              <option value="urgent">{t('urgency.urgent')}</option>
            </Select>
          </Field>
        </div>
        <div className="mt-3 grid gap-3">
          <Field label={t('admin.messageEn')}>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} />
          </Field>
          <Field label={t('admin.messageBn')}>
            <Textarea lang="bn" value={messageBn} onChange={(e) => setMessageBn(e.target.value)} />
          </Field>
        </div>

        {/* Preview in the shape it will actually arrive: an SMS bubble. */}
        {message.trim() && (
          <div className="mt-4">
            <p className="label-field">{t('common.details')}</p>
            <div
              className={cn(
                'max-w-sm rounded-2xl rounded-bl-sm px-4 py-2.5 text-[13px] text-stone-base',
                urgency === 'urgent' ? 'bg-brick' : 'bg-sage',
              )}
            >
              {message}
              <span className="mt-1 block text-right font-mono text-[10px] opacity-70">ThikKori</span>
            </div>
          </div>
        )}

        <Button variant="accent" className="mt-4" onClick={() => void send()} disabled={!message.trim()}>
          <IconMegaphone size={16} />
          {t('admin.send')}
        </Button>
      </Card>

      <section>
        <SectionTitle title={t('admin.history')} />
        {history.length === 0 ? (
          <Card className="p-4 text-[13.5px] text-ink-soft">{t('admin.noAnnouncements')}</Card>
        ) : (
          <div className="grid gap-2">
            {history.map((a) => (
              <Card key={a.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={a.urgency === 'urgent' ? 'brick' : 'teal'}>{t(`urgency.${a.urgency}`)}</Badge>
                  <Badge tone="neutral">
                    {a.target_role === 'all'
                      ? t('admin.targetAll')
                      : a.target_role === 'customers'
                        ? t('admin.targetCustomers')
                        : t('admin.targetProviders')}
                  </Badge>
                  <span className="num ml-auto text-[12px] text-ink-faint">{dateTime(a.sent_at)}</span>
                </div>
                <p className="mt-2 text-[13.5px]">{a.message}</p>
                <p lang="bn" className="mt-1 text-[13.5px] text-ink-soft">
                  {a.message_bn}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
