'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

const ALL_ROLES = ['pilot', 'passenger', 'emergency_contact'] as const;
type Role = (typeof ALL_ROLES)[number];

// --- Phone helpers (mirror the DB logic) ---
function cleanUsPhone(raw: string): string | null {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  if (digits.length === 10) return digits;
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

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState<Role[]>(['passenger']);

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

    // Required name
    if (!name.trim()) {
      setResult({ error: 'Name is required.' });
      return;
    }
    // Client-side phone check (optional field)
    let normalized: string | null = null;
    if (phone.trim() !== '') {
      normalized = cleanUsPhone(phone);
      if (!normalized) {
        setResult({ error: 'Phone must be a valid US 10-digit number' });
        return;
      }
    }

    setSubmitting(true);

    // RPC call – DB will re-check and normalize
    const { data, error } = await supabase.rpc('people_insert_with_roles', {
      p_name: name.trim(),
      p_phone: phone.trim() === '' ? null : phone, // send what user typed; DB normalizes/validates
      p_email: email.trim() || null,
      p_roles: roles,
    });

    setSubmitting(false);

    if (error) {
      setResult({ error: error.message });
      return;
    }

    // Success: show message and format the field exactly as users expect
    const finalDigits = normalized ?? cleanUsPhone(phone); // should match DB
    setPhone(formatUsPhone(finalDigits));
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
            <div>
              <label className="block text-sm font-medium">Full name</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Sam Passenger"
                required
              />
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
              Uses DB function <code>people_insert_with_roles</code>. Only{' '}
              <code>admin</code> or <code>scheduler</code> can succeed.
            </p>
          </form>
        </>
      )}
    </main>
  );
}
