import { Link, useNavigate } from 'react-router-dom';
import { Badge, Button, Card, SectionTitle } from '@/components/ui';
import { CategoryIcon, IconChevron, IconClock, IconPin } from '@/components/Icons';
import { HeroArt } from '@/components/HeroArt';
import { useData } from '@/state/DataContext';
import { useFmt } from '@/lib/useFmt';
import { areaName, categoryName, shortRef } from '@/lib/labels';
import { STATUS_TONE } from '@/features/customer/statusTone';
import type { Customer } from '@/types';

export function CustomerHome({ customer }: { customer: Customer }) {
  const { db } = useData();
  const { t, locale, taka, num, date, slot } = useFmt();
  const navigate = useNavigate();
  if (!db) return null;

  const categories = db.service_categories.filter((c) => c.active).sort((a, b) => a.sort_order - b.sort_order);
  const mine = db.bookings.filter((b) => b.customer_id === customer.id);
  const active = mine
    .filter((b) => b.status !== 'completed' && b.status !== 'cancelled')
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const recent = mine
    .filter((b) => b.status === 'completed' || b.status === 'cancelled')
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 3);

  return (
    <div className="grid gap-7">
      {/* Hero: illustration first, headline second. */}
      <section className="overflow-hidden rounded-2xl border border-stone-line bg-stone-raised">
        <div className="grid md:grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
            <div>
              <h1 className="font-display text-[26px] leading-tight sm:text-[32px]">
                {t('home.greeting', { name: customer.name.split(' ')[0] })}
              </h1>
              <p className="mt-2 max-w-md text-[14.5px] text-ink-soft">{t('app.blurb')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="accent" size="lg" onClick={() => navigate('/customer/new')}>
                {t('bookings.start')}
              </Button>
              <span className="flex items-center gap-1.5 text-[13px] text-ink-soft">
                <IconPin size={16} className="text-teal" />
                {areaName(customer.area, locale)}
              </span>
              <Badge tone="sage">
                {t('home.trust')} {num(customer.trust_score)}
              </Badge>
            </div>
          </div>
          <HeroArt className="h-full w-full object-cover" />
        </div>
      </section>

      {/* Active job — the thing they came back to check. */}
      <section>
        <SectionTitle title={t('home.active')} />
        {active.length ? (
          <div className="grid gap-2">
            {active.map((b) => {
              const req = db.requests.find((r) => r.id === b.request_id);
              const cat = db.service_categories.find((c) => c.id === req?.service_category_id);
              const provider = db.providers.find((p) => p.id === b.provider_id);
              return (
                <Link key={b.id} to={`/customer/booking/${b.id}`}>
                  <Card className="flex items-center gap-4 p-4 transition-colors hover:border-teal/40">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-wash text-teal">
                      <CategoryIcon name={cat?.icon ?? ''} size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold">{categoryName(cat, locale)}</p>
                      <p className="truncate text-[12.5px] text-ink-soft">
                        {provider?.business_name} · {date(b.confirmed_date)} · {slot(b.confirmed_slot)}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONE[b.status]}>{t(`status.${b.status}`)}</Badge>
                    <IconChevron size={18} className="text-ink-faint" />
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="p-4 text-[13.5px] text-ink-soft">{t('home.activeNone')}</Card>
        )}
      </section>

      {/* Category grid. */}
      <section>
        <SectionTitle title={t('home.categories')} hint={t('home.subtitle')} />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate(`/customer/new?category=${c.id}`)}
              className="group flex flex-col gap-2.5 rounded-xl border border-stone-line bg-stone-raised p-4 text-left transition-colors hover:border-teal/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-wash text-teal transition-colors group-hover:bg-teal group-hover:text-stone-base">
                <CategoryIcon name={c.icon} size={22} />
              </span>
              <span className="text-[13.5px] font-semibold leading-snug">{categoryName(c, locale)}</span>
              <span className="num mt-auto text-[12px] text-ink-faint">{taka(c.base_price)}+</span>
            </button>
          ))}
        </div>
      </section>

      {/* How it works — three plain steps, no decoration. */}
      <section>
        <SectionTitle title={t('home.howItWorks')} />
        <div className="grid gap-2 sm:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="p-4">
              <span className="num flex h-7 w-7 items-center justify-center rounded-full bg-amber text-[13px] font-bold text-ink">
                {num(n)}
              </span>
              <p className="mt-3 text-[14.5px] font-semibold">{t(`home.step${n}`)}</p>
              <p className="mt-1 text-[13px] leading-snug text-ink-soft">{t(`home.step${n}Desc`)}</p>
            </Card>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <SectionTitle
            title={t('home.recent')}
            action={
              <Link to="/customer/bookings" className="text-[13px] font-semibold text-teal hover:underline">
                {t('common.view')}
              </Link>
            }
          />
          <div className="grid gap-2">
            {recent.map((b) => {
              const req = db.requests.find((r) => r.id === b.request_id);
              const cat = db.service_categories.find((c) => c.id === req?.service_category_id);
              return (
                <Card key={b.id} className="flex items-center gap-3 p-3.5">
                  <IconClock size={18} className="shrink-0 text-ink-faint" />
                  <span className="min-w-0 flex-1 truncate text-[14px]">{categoryName(cat, locale)}</span>
                  <span className="num shrink-0 text-[12.5px] text-ink-faint">{shortRef(b.id)}</span>
                  <span className="num shrink-0 text-[13px] font-semibold">{taka(b.agreed_price)}</span>
                  <Badge tone={STATUS_TONE[b.status]}>{t(`status.${b.status}`)}</Badge>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
