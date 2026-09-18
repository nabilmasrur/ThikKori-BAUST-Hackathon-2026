import { useState, useRef } from 'react';
import { Button, Card, Field, Input } from '@/components/ui';
import { useData } from '@/state/DataContext';
import { useToast } from '@/state/ToastContext';
import type { Provider } from '@/types';

export function ProviderProfile({ provider }: { provider: Provider }) {
  const { adapter, db, refresh } = useData();
  const { push } = useToast();
  
  const [email, setEmail] = useState(provider.email);
  const [phone, setPhone] = useState(provider.phone);
  const [baseArea, setBaseArea] = useState(provider.base_area);
  const [hourlyRate, setHourlyRate] = useState(provider.hourly_rate.toString());
  const [avatarUrl, setAvatarUrl] = useState(provider.avatar_url || '');
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const tierMeta = db?.provider_tiers.find(t => t.tier_name === provider.tier);
  const maxMultiplier = tierMeta?.max_wage_multiplier || 1;
  const baseWage = 100; // Assuming base wage unit
  const maxAllowedWage = baseWage * maxMultiplier;

  const save = async () => {
    if (!adapter) return;
    const newRate = Number(hourlyRate);
    if (isNaN(newRate) || newRate < 0) {
      push('Please enter a valid hourly rate.', 'alert');
      return;
    }
    if (newRate > maxAllowedWage) {
      push(`Your tier (${provider.tier}) max hourly rate is ৳${maxAllowedWage}.`, 'alert');
      return;
    }

    setBusy(true);
    await adapter.update('providers', provider.id, {
      email,
      phone,
      base_area: baseArea,
      hourly_rate: newRate,
      avatar_url: avatarUrl,
    });
    await refresh();
    push('Profile updated successfully!', 'success');
    setBusy(false);
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 font-display text-[28px]">My Profile</h1>
      <Card className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <div
            className="flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-stone-line bg-stone-raised text-3xl text-ink-faint"
            onClick={() => fileInput.current?.click()}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              '👤'
            )}
          </div>
          <div>
            <Button variant="outline" onClick={() => fileInput.current?.click()}>
              Change Picture
            </Button>
            <input
              type="file"
              ref={fileInput}
              className="hidden"
              accept="image/*"
              onChange={handleImage}
            />
          </div>
        </div>

        <div className="grid gap-4">
          <Field label="Email">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Base Area">
            <Input value={baseArea} onChange={(e) => setBaseArea(e.target.value)} />
          </Field>
          <Field label={`Hourly Rate (Max: ৳${maxAllowedWage})`}>
            <Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
          </Field>

          <Button onClick={save} disabled={busy} variant="accent" className="mt-4">
            {busy ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
