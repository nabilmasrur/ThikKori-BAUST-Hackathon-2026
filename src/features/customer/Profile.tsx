import { useState, useRef } from 'react';
import { Button, Card, Field, Input } from '@/components/ui';
import { useData } from '@/state/DataContext';
import { useToast } from '@/state/ToastContext';
import type { Customer } from '@/types';

export function CustomerProfile({ customer }: { customer: Customer }) {
  const { adapter, refresh } = useData();
  const { push } = useToast();
  const [email, setEmail] = useState(customer.email);
  const [phone, setPhone] = useState(customer.phone);
  const [address, setAddress] = useState(customer.address);
  const [area, setArea] = useState(customer.area);
  const [avatarUrl, setAvatarUrl] = useState(customer.avatar_url || '');
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const save = async () => {
    if (!adapter) return;
    setBusy(true);
    await adapter.update('customers', customer.id, {
      email,
      phone,
      address,
      area,
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
          <Field label="Area">
            <Input value={area} onChange={(e) => setArea(e.target.value)} />
          </Field>
          <Field label="Address">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>

          <Button onClick={save} disabled={busy} variant="accent" className="mt-4">
            {busy ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
