'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

const ALL_ROLES = ['pilot', 'passenger', 'emergency_contact'] as const;
type Role = (typeof ALL_ROLES)[number];

// Name + phone helpers (mirror DB behavior)
function cleanName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}
function cleanUsPhone(raw: string): string | null {
  const d = (raw || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) return d.slice(1);
  if (d.length === 10) return d;
  return null;
}
function formatUsPhone(digits: string | null): string {
  if (!digits || digits.length !== 10) return '';
  return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
}

export default function AddPersonPage() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [canSchedule, setCanSchedule] = useState<boolean | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [email, setEmail]         = useState('');
  const [roles, setRoles]         = useState<Role[]>(['passenger']);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ id?: string; error?: string; ok?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
      setSessionChecked(true);
    });
  }, []);
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setIsLoggedIn(!!s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const toggleRole = (r: Role) => {
    setRoles(prev => (prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]));
  };
  const rolesLabel = useMemo(() => roles.join(', ') || '—', [roles]);

  const checkAccess = async () => {
    setCanSchedule(null);
    const { data, error } = await supabase.rpc('can_schedule_rides');
    if (error) {
      setResult({ error: error.message });
      setCanSchedule(false);
      return;
    }
    setCanSchedule(!!data);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    const fn = cleanName(firstName);
    const ln = cleanName(lastName);

    if (!fn) {
      setResult({ error: 'First name is required.' });
      return;
    }

    // Optional phone: pre-check for a US number
    let normalizedPhone: string | null = null;
    if (phone.trim() !== '') {
      normalizedPhone = cleanUsPhone(phone);
      if (!normalizedPhone) {
        setResult({ error: 'Phone must be a valid US 10-digit number' });
        return;
      }
    }

    setSubmitting(true);

    // Call the new RPC that accepts first/last names
    const { data, error } = await supabase.rpc('people_insert_with_roles_v2', {
      p_first_name: fn,
      p_last_name: ln || null,
      p_phone: phone.trim() === '' ? null : phone, // send original; DB revalidates/normalizes
      p_email: email.trim() || null,
      p_roles: roles,
    });

    setSubmitting(false);

    if (error) {
      setResult({ error: error.message });
      return;
    }

    // Success: normalize displayed values to match DB conventions
    setFirstName(fn);
    setLastName(ln);
    setPhone(formatUsPhone(normalizedPhone ?? cleanUsPhone(phone)));
    setResult({ id: data as string, ok: 'Person created.' });
  };

  return (
    <main className="mx-auto max-w-xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Add Person (Admin/Scheduler)</h1>

      {!sessionChecked ? (
        <p>Checking login…</p>
      ) : !isLoggedIn ? (
        <div className="rounded-md border p-4 bg-yellow-50">
          <p className="font-medium">Please sign in first.</p>
          <p className="text-sm opacity-80">
            Use the account with role <code>admin</code> or <code>scheduler</code>.
          </p>
        </div>
      ) : (
        <>
          <section className="rounded-md border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={checkAccess}
                className="rounded px-3 py-1.5 border hover:bg-gray-50"
              >
                Check admin/scheduler access
              </button>
              {canSchedule === true && (
                <span className="text-green-700 font-medium">Access: TRUE</span>
              )}
              {canSchedule === false && (
                <span className="text-red-700 font-medium">Access: FALSE</span>
              )}
            </div>
            <p className="text-sm opacity-70">
              (Calls <code>can_schedule_rides()</code> in the database.)
            </p>
          </section>

          <form onSubmit={submit} className="rounded-md border p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">First name</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="e.g., Sam"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Last name (optional)</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="e.g., Passenger"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Phone (optional)</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(678) 233-2332"
                />
                <p className="text-xs opacity-60 mt-1">
                  If provided, must be a valid US number (10 digits).
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium">Email (optional)</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.org"
                />
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Roles</legend>
              <div className="flex flex-wrap gap-4">
                {ALL_ROLES.map(r => (
                  <label key={r} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={roles.includes(r)}
                      onChange={() => toggleRole(r)}
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs opacity-60">Selected: {rolesLabel}</p>
            </fieldset>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded px-3 py-1.5 border bg-black text-white disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Save person'}
              </button>
              {result?.ok && result?.id && (
                <span className="text-green-700">
                  {result.ok} ID: <code>{result.id}</code>
                </span>
              )}
              {result?.error && <span className="text-red-700">Error: {result.error}</span>}
            </div>

            <p className="text-xs opacity-60">
              Uses DB function <code>people_insert_with_roles_v2</code>. Only{' '}
              <code>admin</code> or <code>scheduler</code> can succeed.
            </p>
          </form>
        </>
      )}
    </main>
  );
}
