'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

/**
 * Minimal, self-contained page to add a Person via the secure RPC
 * people_insert_with_roles (admin/scheduler only).
 *
 * Works on preview branches. Requires you to be logged in and your profile
 * role to be 'admin' or 'scheduler'.
 */

// Create a browser Supabase client (public keys only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

const ALL_ROLES = ['pilot', 'passenger', 'emergency_contact'] as const;
type Role = (typeof ALL_ROLES)[number];

export default function AddPersonPage() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [canSchedule, setCanSchedule] = useState<boolean | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState<Role[]>(['passenger']);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ id?: string; error?: string } | null>(null);

  // Check login on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
      setSessionChecked(true);
    });
  }, []);

  // Optional: live session changes
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setIsLoggedIn(!!s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const toggleRole = (r: Role) => {
    setRoles(prev =>
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    );
  };

  const rolesLabel = useMemo(() => roles.join(', ') || '—', [roles]);

  const checkAccess = async () => {
    setCanSchedule(null);
    // can_schedule_rides() returns boolean, granted to 'authenticated'
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
    setSubmitting(true);
    setResult(null);

    // Basic form sanity
    if (!name.trim()) {
      setSubmitting(false);
      setResult({ error: 'Name is required.' });
      return;
    }
    if (roles.length === 0) {
      setSubmitting(false);
      setResult({ error: 'Pick at least one role.' });
      return;
    }

    // Call the secure RPC (DB enforces admin/scheduler)
    const { data, error } = await supabase.rpc('people_insert_with_roles', {
      p_name: name.trim(),
      p_phone: phone.trim() || null,
      p_email: email.trim() || null,
      p_roles: roles, // string[]
    });

    if (error) setResult({ error: error.message });
    else setResult({ id: data as string });

    setSubmitting(false);
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
            Use the same account you set to role <code>admin</code> (or{' '}
            <code>scheduler</code>) in <code>public.profiles</code>. Then reload this page.
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
              (This calls <code>can_schedule_rides()</code> in the database.)
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
                  placeholder="555-555-1212"
                />
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
              {result?.id && (
                <span className="text-green-700">
                  Created person with id <code>{result.id}</code>
                </span>
              )}
              {result?.error && (
                <span className="text-red-700">Error: {result.error}</span>
              )}
            </div>

            <p className="text-xs opacity-60">
              This uses the DB function <code>people_insert_with_roles</code> we created.
              Only <code>admin</code> or <code>scheduler</code> can succeed.
            </p>
          </form>
        </>
      )}
    </main>
  );
}
