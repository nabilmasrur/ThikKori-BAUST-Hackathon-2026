import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge, Button, Card, Field, Input, Select, Textarea } from '@/components/ui';
import { CategoryIcon } from '@/components/Icons';
import { DHAKA_AREAS, TIME_WINDOWS } from '@/lib/constants';
import { addDaysISO, todayISO } from '@/lib/format';
import { areaName, categoryName } from '@/lib/labels';
import { createRequestWithMatches } from '@/data/operations';
import { useData } from '@/state/DataContext';
import { useToast } from '@/state/ToastContext';
import { useFmt } from '@/lib/useFmt';
import { cn } from '@/lib/cn';
import type { Customer, Urgency } from '@/types';

const STEPS = ['step1', 'step2', 'step3', 'step4'] as const;

export function RequestWizard({ customer }: { customer: Customer }) {
  const { db, adapter } = useData();
  const { push } = useToast();
  const { t, locale, taka, digits, date: fmtDate, slot: fmtSlot } = useFmt();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [step, setStep] = useState(params.get('category') ? 1 : 0);
  const [categoryId, setCategoryId] = useState(params.get('category') ?? '');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState(customer.area);
  const [address, setAddress] = useState(customer.address);
  const [image, setImage] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<Urgency>('normal');
  const [date, setDate] = useState(todayISO());
  const [window, setWindow] = useState<string>('16:00-18:00');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = useMemo(
    () => (db?.service_categories ?? []).filter((c) => c.active).sort((a, b) => a.sort_order - b.sort_order),
    [db],
  );
  const category = categories.find((c) => c.id === categoryId);
  const areaMeta = DHAKA_AREAS.find((a) => a.name === area) ?? DHAKA_AREAS[0];

  const validate = (s: number) => {
    const next: Record<string, string> = {};
    if (s === 0 && !categoryId) next.category = t('errors.formRequired');
    if (s === 1) {
      if (description.trim().length < 8) next.description = t('errors.formRequired');
      if (!address.trim()) next.address = t('errors.formRequired');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const go = (delta: number) => {
    if (delta > 0 && !validate(step)) return;
    setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + delta)));
  };

  const submit = async () => {
    if (!db || !category) return;
    setBusy(true);
    try {
      const { request } = await createRequestWithMatches(adapter, db, {
        customer_id: customer.id,
        service_category_id: category.id,
        area,
        address,
        lat: areaMeta.lat,
        lng: areaMeta.lng,
        preferred_date: date,
        preferred_time_window: window,
        urgency,
        problem_description: description.trim(),
        image_url: image,
      });
      push(t('toast.requestCreated'));
      navigate(`/customer/match/${request.id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-[24px]">{t('wizard.title')}</h1>

      {/* Step rail */}
      <ol className="mt-4 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-1.5">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={cn(
                'flex w-full flex-col gap-1.5 text-left',
                i <= step ? 'text-ink' : 'text-ink-faint',
                i < step && 'cursor-pointer',
              )}
            >
              <span
                className={cn(
                  'h-1 w-full rounded-full',
                  i < step ? 'bg-teal' : i === step ? 'bg-amber' : 'bg-stone-line',
                )}
              />
              <span className="text-[11.5px] font-semibold">{t(`wizard.${s}`)}</span>
            </button>
          </li>
        ))}
      </ol>

      <Card className="mt-4 p-5">
        {step === 0 && (
          <>
            <h2 className="font-display text-[18px]">{t('wizard.chooseCategory')}</h2>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(c.id);
                    setErrors({});
                  }}
                  aria-pressed={categoryId === c.id}
                  className={cn(
                    'flex flex-col gap-2 rounded-xl border p-3.5 text-left transition-colors',
                    categoryId === c.id
                      ? 'border-teal bg-teal-wash'
                      : 'border-stone-line bg-stone-raised hover:border-teal/40',
                  )}
                >
                  <CategoryIcon name={c.icon} size={22} className="text-teal" />
                  <span className="text-[13px] font-semibold leading-snug">{categoryName(c, locale)}</span>
                  <span className="num text-[11.5px] text-ink-faint">{taka(c.base_price)}+</span>
                </button>
              ))}
            </div>
            {errors.category && <p className="mt-3 text-[12.5px] font-medium text-brick">{errors.category}</p>}
          </>
        )}

        {step === 1 && (
          <div className="grid gap-4">
            <Field
              label={t('wizard.describe')}
              hint={t('wizard.describeHint')}
              error={errors.description}
            >
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('wizard.describePlaceholder')}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('wizard.area')}>
                <Select value={area} onChange={(e) => setArea(e.target.value)}>
                  {DHAKA_AREAS.map((a) => (
                    <option key={a.name} value={a.name}>
                      {areaName(a.name, locale)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('wizard.address')} error={errors.address}>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('wizard.addressPlaceholder')}
                />
              </Field>
            </div>

            <div>
              <span className="label-field">{t('urgency.label')}</span>
              <div className="grid gap-2 sm:grid-cols-3">
                {(['normal', 'urgent', 'emergency'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUrgency(u)}
                    aria-pressed={urgency === u}
                    className={cn(
                      'rounded-lg border p-3 text-left transition-colors',
                      urgency === u
                        ? u === 'normal'
                          ? 'border-teal bg-teal-wash'
                          : 'border-brick bg-brick-wash'
                        : 'border-stone-line bg-stone-raised hover:border-teal/40',
                    )}
                  >
                    <span className="block text-[13.5px] font-semibold">{t(`urgency.${u}`)}</span>
                    <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-soft">
                      {t(`urgency.${u}Desc`)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="label-field">
                {t('wizard.photo')} <span className="font-normal text-ink-faint">({t('common.optional')})</span>
              </span>
              {image ? (
                <div className="flex items-center gap-3">
                  <img src={image} alt="" className="h-20 w-20 rounded-lg border border-stone-line object-cover" />
                  <Button variant="danger" size="sm" onClick={() => setImage(null)}>
                    {t('wizard.photoRemove')}
                  </Button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-stone-line bg-stone-base/60 px-4 py-6 text-[13px] text-ink-soft hover:border-teal/50">
                  {t('wizard.photoAdd')}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) setImage(await downscale(file));
                    }}
                  />
                </label>
              )}
              <p className="mt-1 text-[12px] text-ink-faint">{t('wizard.photoHint')}</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4">
            <h2 className="font-display text-[18px]">{t('wizard.when')}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('wizard.pickDate')}>
                <Input
                  type="date"
                  value={date}
                  min={todayISO()}
                  max={addDaysISO(21)}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
            </div>
            <div>
              <span className="label-field">{t('wizard.pickWindow')}</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TIME_WINDOWS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWindow(w)}
                    aria-pressed={window === w}
                    className={cn(
                      'num rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition-colors',
                      window === w
                        ? 'border-teal bg-teal text-stone-base'
                        : 'border-stone-line bg-stone-raised hover:border-teal/40',
                    )}
                  >
                    {fmtSlot(w)}
                  </button>
                ))}
              </div>

            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-display text-[18px]">{t('wizard.review')}</h2>
            <dl className="mt-4 divide-y divide-stone-line">
              <Row label={t('wizard.step1')} value={categoryName(category, locale)} onEdit={() => setStep(0)} edit={t('wizard.editStep')} />
              <Row label={t('wizard.problem')} value={description} onEdit={() => setStep(1)} edit={t('wizard.editStep')} />
              <Row
                label={t('wizard.address')}
                value={`${address}, ${areaName(area, locale)}`}
                onEdit={() => setStep(1)}
                edit={t('wizard.editStep')}
              />
              <Row
                label={t('common.date')}
                value={`${fmtDate(date)} · ${fmtSlot(window)}`}
                onEdit={() => setStep(2)}
                edit={t('wizard.editStep')}
              />
              <div className="flex items-center justify-between py-3">
                <dt className="text-[13px] text-ink-soft">{t('urgency.label')}</dt>
                <dd>
                  <Badge tone={urgency === 'normal' ? 'teal' : 'brick'}>{t(`urgency.${urgency}`)}</Badge>
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Card>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => (step === 0 ? navigate('/customer') : go(-1))}>
          {step === 0 ? t('common.cancel') : t('common.back')}
        </Button>
        <span className="num text-[12px] text-ink-faint">
          {t('common.step', { current: digits(String(step + 1)), total: digits(String(STEPS.length)) })}
        </span>
        {step < STEPS.length - 1 ? (
          <Button variant="primary" onClick={() => go(1)}>
            {t('common.next')}
          </Button>
        ) : (
          <Button variant="accent" onClick={submit} disabled={busy}>
            {t('wizard.findProviders')}
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  onEdit,
  edit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
  edit: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="shrink-0 text-[13px] text-ink-soft">{label}</dt>
      <dd className="min-w-0 flex-1 text-right text-[13.5px]">{value}</dd>
      <button type="button" onClick={onEdit} className="shrink-0 text-[12.5px] font-semibold text-teal hover:underline">
        {edit}
      </button>
    </div>
  );
}

/** Keep attached photos small enough to live happily in the row. */
async function downscale(file: File, max = 900): Promise<string> {
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  }).catch(() => null);
  if (!img) return dataUrl;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.78);
}
