import { useState } from 'react';
import { Badge, Button, Card, Field, Input, Modal } from '@/components/ui';
import { CategoryIcon, IconPlus } from '@/components/Icons';
import { newId } from '@/data/operations';
import { useData } from '@/state/DataContext';
import { useToast } from '@/state/ToastContext';
import { useFmt } from '@/lib/useFmt';
import type { ServiceCategory } from '@/types';

const BLANK = { id: '', name: '', name_bn: '', base_price: '900', icon: 'maintenance' };

export function CategoriesAdmin() {
  const { db, adapter } = useData();
  const { push } = useToast();
  const { t, taka, num } = useFmt();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(BLANK);

  if (!db) return null;
  const categories = [...db.service_categories].sort((a, b) => a.sort_order - b.sort_order);

  const toggle = async (c: ServiceCategory) => {
    await adapter.update('service_categories', c.id, { active: !c.active });
    push(t('toast.categorySaved'), 'success');
  };

  const save = async () => {
    if (!form.name.trim()) return;
    const price = Number(form.base_price) || 0;
    if (form.id) {
      await adapter.update('service_categories', form.id, {
        name: form.name.trim(),
        name_bn: form.name_bn.trim(),
        base_price: price,
      });
    } else {
      await adapter.insert('service_categories', [
        {
          id: newId().slice(0, 8),
          name: form.name.trim(),
          name_bn: form.name_bn.trim() || form.name.trim(),
          icon: form.icon,
          base_price: price,
          active: true,
          sort_order: categories.length + 1,
        },
      ]);
    }
    setOpen(false);
    setForm(BLANK);
    push(t('toast.categorySaved'), 'success');
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[26px]">{t('admin.categoriesTitle')}</h1>
        <Button
          variant="accent"
          onClick={() => {
            setForm(BLANK);
            setOpen(true);
          }}
        >
          <IconPlus size={16} />
          {t('admin.addCategory')}
        </Button>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Card key={c.id} className={`p-4 ${c.active ? '' : 'opacity-60'}`}>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-wash text-teal">
                <CategoryIcon name={c.icon} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{c.name}</p>
                <p lang="bn" className="truncate text-[12.5px] text-ink-soft">
                  {c.name_bn}
                </p>
              </div>
              <Badge tone={c.active ? 'sage' : 'neutral'}>{c.active ? t('admin.visible') : t('admin.hidden')}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="num text-[13px] font-semibold">{taka(c.base_price)}</span>
              <span className="num text-[11.5px] text-ink-faint">
                {num(db.bookings.filter((b) => {
                  const r = db.requests.find((x) => x.id === b.request_id);
                  return r?.service_category_id === c.id;
                }).length)}{' '}
                {t('nav.bookings').toLowerCase()}
              </span>
            </div>
            <div className="mt-3 flex gap-1.5">
              <Button
                size="sm"
                variant="quiet"
                onClick={() => {
                  setForm({
                    id: c.id,
                    name: c.name,
                    name_bn: c.name_bn,
                    base_price: String(c.base_price),
                    icon: c.icon,
                  });
                  setOpen(true);
                }}
              >
                {t('wizard.editStep')}
              </Button>
              <Button size="sm" variant={c.active ? 'danger' : 'outline'} onClick={() => void toggle(c)}>
                {c.active ? t('admin.disable') : t('admin.enable')}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? t('wizard.editStep') : t('admin.addCategory')}
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
          <Field label={t('admin.categoryName')}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label={t('admin.categoryNameBn')}>
            <Input lang="bn" value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })} />
          </Field>
          <Field label={t('admin.basePrice')}>
            <Input
              inputMode="numeric"
              value={form.base_price}
              onChange={(e) => setForm({ ...form, base_price: e.target.value })}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
