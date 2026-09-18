import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Field, Input } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { IconArrowLeft } from '@/components/Icons';
import { useFmt } from '@/lib/useFmt';

type Step = 'form' | 'pending';

export function SignupPage() {
  const { t } = useFmt();
  const navigate = useNavigate();

  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<Step>('form');

  const validate = (): string => {
    if (!name.trim()) return 'Full name is required.';
    if (!email.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(email))
      return 'Enter a valid email address.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10)
      return 'Enter a valid phone number (min 10 digits).';
    if (role === 'provider' && !profession.trim())
      return 'Profession is required for providers.';
    return '';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setBusy(true);
    setError('');

    try {
      // Read the current DB snapshot directly from localStorage
      const STORAGE_KEY = 'thikkori.db.v4';
      const raw = localStorage.getItem(STORAGE_KEY);
      const dbData = raw ? JSON.parse(raw) : null;

      if (!dbData) {
        setError('App data not ready yet. Please refresh the page and try again.');
        return;
      }

      const emailLower = email.trim().toLowerCase();

      // Duplicate email check
      const existingCustomer = (dbData.customers ?? []).find(
        (c: { email?: string }) => c.email?.toLowerCase() === emailLower,
      );
      const existingProvider = (dbData.providers ?? []).find(
        (p: { email?: string }) => p.email?.toLowerCase() === emailLower,
      );
      const existingPending = (dbData.signup_requests ?? []).find(
        (r: { email: string; status: string }) =>
          r.email.toLowerCase() === emailLower && r.status === 'pending',
      );

      if (existingCustomer || existingProvider) {
        setError('This email is already registered. Please sign in.');
        return;
      }
      if (existingPending) {
        setError('A signup request with this email is already pending approval.');
        return;
      }

      // Build new signup request object
      const newRequest = {
        id: crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role,
        name: name.trim(),
        email: emailLower,
        password,
        phone: phone.trim(),
        profession: role === 'provider' ? profession.trim() : '',
        status: 'pending',
        created_at: new Date().toISOString(),
        reviewed_at: null,
      };

      // Append to signup_requests and persist
      const signupRequests = Array.isArray(dbData.signup_requests)
        ? dbData.signup_requests
        : [];
      signupRequests.push(newRequest);
      dbData.signup_requests = signupRequests;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dbData));

      // Also write to CSV via dev-server (best-effort)
      try {
        await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role,
            name: newRequest.name,
            phone: newRequest.phone,
            email: emailLower,
            profession: newRequest.profession,
          }),
        });
      } catch {
        // offline / prod — skip silently
      }

      setStep('pending');
    } catch (ex) {
      setError('Something went wrong. Please try again.');
      console.error(ex);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-[100dvh]">
      {/* Header */}
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-stone-deep hover:text-ink transition-colors"
            title={t('common.back') || 'Back'}
          >
            <IconArrowLeft size={20} />
          </button>
          <Link to="/"><Logo size="sm" /></Link>
        </div>
        <LanguageToggle />
      </div>

      <div className="mx-auto max-w-sm px-5 pb-16 pt-6">
        {step === 'pending' ? (
          /* ── Pending approval state ──────────────────────────── */
          <div className="mt-6 text-center">
            {/* Animated hourglass */}
            <div className="mx-auto flex h-24 w-24 items-center justify-center">
              <svg viewBox="0 0 80 80" width="96" height="96" xmlns="http://www.w3.org/2000/svg">
                {/* Glow ring */}
                <circle cx="40" cy="40" r="36" fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.5">
                  <animate attributeName="r" values="36;39;36" keyTimes="0;0.5;1" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;1;0.5" keyTimes="0;0.5;1" dur="3s" repeatCount="indefinite" />
                </circle>
                {/* Background circle */}
                <circle cx="40" cy="40" r="34" fill="#fef3c7"/>

                {/* Hourglass group that flips */}
                <g transform="translate(40,40)">
                  <g>
                    <animateTransform attributeName="transform" type="rotate" values="0; 0; 180; 180" keyTimes="0; 0.4; 0.5; 1" dur="3s" repeatCount="indefinite" />
                    
                    {/* Outer frame */}
                    <path d="M-14,-20 L14,-20 L6,-2 L6,2 L14,20 L-14,20 L-6,2 L-6,-2 Z"
                      fill="none" stroke="#92400e" strokeWidth="2.5" strokeLinejoin="round"/>
                    {/* Top cap */}
                    <rect x="-15" y="-22" width="30" height="4" rx="2" fill="#92400e"/>
                    {/* Bottom cap */}
                    <rect x="-15" y="18" width="30" height="4" rx="2" fill="#92400e"/>

                    {/* Top sand — drains away */}
                    <clipPath id="clip-top">
                      <path d="M-13,-20 L13,-20 L5,-2 L-5,-2 Z"/>
                    </clipPath>
                    <g clipPath="url(#clip-top)">
                      <g>
                        {/* We scale relative to 0,-2. Standard SVG scale originates from 0,0. 
                            So we translate to 0,-2, scale, then translate back. */}
                        <animateTransform attributeName="transform" type="translate" values="0,-2; 0,-2; 0,-2; 0,-2" keyTimes="0; 0.4; 0.5; 1" dur="3s" repeatCount="indefinite" additive="sum"/>
                        <animateTransform attributeName="transform" type="scale" values="1,1; 1,0; 1,0; 1,1" keyTimes="0; 0.4; 0.5; 1" dur="3s" repeatCount="indefinite" additive="sum"/>
                        <animateTransform attributeName="transform" type="translate" values="0,2; 0,2; 0,2; 0,2" keyTimes="0; 0.4; 0.5; 1" dur="3s" repeatCount="indefinite" additive="sum"/>
                        <path d="M-13,-20 L13,-20 L5,-2 L-5,-2 Z" fill="#fbbf24"/>
                      </g>
                    </g>

                    {/* Bottom sand — fills up */}
                    <clipPath id="clip-bot">
                      <path d="M-5,2 L5,2 L13,20 L-13,20 Z"/>
                    </clipPath>
                    <g clipPath="url(#clip-bot)">
                      <g>
                        <animateTransform attributeName="transform" type="translate" values="0,2; 0,2; 0,2; 0,2" keyTimes="0; 0.4; 0.5; 1" dur="3s" repeatCount="indefinite" additive="sum"/>
                        <animateTransform attributeName="transform" type="scale" values="1,0; 1,1; 1,1; 1,0" keyTimes="0; 0.4; 0.5; 1" dur="3s" repeatCount="indefinite" additive="sum"/>
                        <animateTransform attributeName="transform" type="translate" values="0,-2; 0,-2; 0,-2; 0,-2" keyTimes="0; 0.4; 0.5; 1" dur="3s" repeatCount="indefinite" additive="sum"/>
                        <path d="M-5,2 L5,2 L13,20 L-13,20 Z" fill="#fbbf24"/>
                      </g>
                    </g>

                    {/* Falling sand stream */}
                    <g>
                      <animate attributeName="opacity" values="1; 1; 0; 0" keyTimes="0; 0.45; 0.46; 1" dur="3s" repeatCount="indefinite"/>
                      <animateTransform attributeName="transform" type="scale" values="1,1; 1,1; 1,1; 1,1" keyTimes="0; 0.45; 0.46; 1" dur="3s" repeatCount="indefinite" additive="sum"/>
                      <rect x="-1.2" y="-2" width="2.4" height="22" rx="1" fill="#f59e0b" opacity="0.9">
                        {/* Make stream fall down by translating Y or animating height */}
                        <animate attributeName="y" values="-2; -2; 18; 18" keyTimes="0; 0.4; 0.45; 1" dur="3s" repeatCount="indefinite" />
                        <animate attributeName="height" values="4; 22; 2; 2" keyTimes="0; 0.1; 0.45; 1" dur="3s" repeatCount="indefinite" />
                      </rect>
                    </g>
                  </g>
                </g>
              </svg>
            </div>
            <h1 className="mt-5 font-display text-[24px]">Request Submitted!</h1>
            <p className="mt-3 text-[14px] text-ink-soft leading-relaxed">
              Your signup request has been sent to the admin for review.<br />
              You can login once it is <strong>approved</strong>.
            </p>
            <div className="mt-6 rounded-xl border border-stone-line bg-stone-raised p-4 text-left text-[13px]">
              <p className="font-semibold text-ink mb-2">Request details:</p>
              <ul className="grid gap-1 text-ink-soft">
                <li>
                  <span className="font-medium text-ink">Role: </span>
                  {role === 'customer' ? 'Customer' : 'Provider'}
                </li>
                <li><span className="font-medium text-ink">Name: </span>{name}</li>
                <li><span className="font-medium text-ink">Email: </span>{email}</li>
                {role === 'provider' && (
                  <li>
                    <span className="font-medium text-ink">Profession: </span>
                    {profession}
                  </li>
                )}
              </ul>
            </div>
            <Button variant="outline" className="mt-6" full onClick={() => navigate('/login')}>
              Go to Sign In
            </Button>
          </div>
        ) : (
          /* ── Signup form ─────────────────────────────────────── */
          <>
            <h1 className="font-display text-[28px]">Create Account</h1>
            <p className="mt-1.5 text-[14px] text-ink-soft">
              Submit your details — admin will review and approve your account.
            </p>

            <form onSubmit={submit} className="mt-7 grid gap-4" noValidate>
              {/* Role toggle */}
              <div className="flex gap-2 p-1 bg-stone-raised rounded-lg border border-stone-line">
                <button
                  type="button"
                  className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition-colors ${
                    role === 'customer'
                      ? 'bg-stone-base shadow-sm text-ink'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                  onClick={() => { setRole('customer'); setError(''); }}
                >
                  Customer
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition-colors ${
                    role === 'provider'
                      ? 'bg-stone-base shadow-sm text-ink'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                  onClick={() => { setRole('provider'); setError(''); }}
                >
                  Provider
                </button>
              </div>

              <Field label="Full Name">
                <Input
                  value={name}
                  placeholder="e.g. Rahim Uddin"
                  autoComplete="name"
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                />
              </Field>

              {role === 'provider' && (
                <Field label="Profession / Service Category">
                  <Input
                    value={profession}
                    placeholder="e.g. AC Repair, Plumber, Electrician"
                    onChange={(e) => { setProfession(e.target.value); setError(''); }}
                  />
                </Field>
              )}

              <Field label="Phone Number">
                <Input
                  value={phone}
                  inputMode="tel"
                  placeholder="01711000101"
                  autoComplete="tel"
                  onChange={(e) => { setPhone(e.target.value); setError(''); }}
                />
              </Field>

              <Field label="Email Address">
                <Input
                  type="email"
                  value={email}
                  placeholder="you@example.com"
                  autoComplete="email"
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                />
              </Field>

              <Field label="Password">
                <Input
                  type="password"
                  value={password}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                />
              </Field>

              <Field label="Confirm Password" error={error || undefined}>
                <Input
                  type="password"
                  value={confirmPassword}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                />
              </Field>

              <Button
                type="submit"
                variant="accent"
                className="mt-2"
                full
                disabled={busy}
              >
                {busy ? 'Submitting…' : 'Submit Signup Request'}
              </Button>

              <p className="mt-2 text-center text-[13px] text-ink-soft">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-teal hover:underline">
                  Sign In
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
