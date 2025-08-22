'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

// Role precedence for sorting
const ROLE_WEIGHT: Record<string, number> = {
  pilot: 0,
  passenger: 1,
  emergency_contact: 2,
};

type PersonRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
  phone: string | null;
  phone_formatted: string | null;
  email: string | null;
  roles: string[];     // ['pilot','passenger',...]
  roles_str: string;   // "pilot, passenger"
  created_at: string;
};

type Role = 'pilot' | 'passenger' | 'emergency_contact';
const ALL_ROLES: Role[] = ['pilot', 'passenger', 'emergency_contact'];

// --- Helpers (mirror DB normalizers/formatters for UX) ---
function cleanName(v: string) {
  return v.replace(/\s+/g, ' ').trim();
}
function cleanUsPhone(raw: string): string | null {
  const d = (raw || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) return d.slice(1);
  if (d.length === 10) return d;
  return null;
}
function formatUsPhone(digits: string | null): string {
  if (!digits || digits.length !== 10) return '';
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
function roleSortKey(roles: string[]) {
  if (!roles || roles.length === 0) return 99;
  let best = 99;
  for (const r of roles) best = Math.min(best, ROLE_WEIGHT[r] ?? 98);
  return best;
}

export default function PeopleAdminPage() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [canSchedule, setCanSchedule] = useState<boolean | null>(null);

  const [people, setPeople] = useState<PersonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & sort state
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'last' | 'role'>('last');

  // New/Edit modals
  const [showNew, setShowNew] = useState(false);
  const [editRow, setEditRow] = useState<PersonRow | null>(null);

  // Fields for form (re-used for New and Edit)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [email, setEmail]         = useState('');
  const [roles, setRoles]         = useState<Role[]>(['passenger']);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // login/session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
      setSessionChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setIsLoggedIn(!!s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const fetchAccess = async () => {
    const { data, error } = await supabase.rpc('can_schedule_rides');
    if (error) {
      setCanSchedule(false);
      return;
    }
    setCanSchedule(!!data);
  };

  const fetchPeople = async () => {
    setLoading(true);
    setErrorMsg(null);
    const { data, error } = await supabase
      .from('people_index_v')
      .select('*');
    if (error) {
      setErrorMsg(error.message);
    } else {
      setPeople((data as PersonRow[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchAccess();
      fetchPeople();
    }
  }, [isLoggedIn]);

  const toggleRole = (r: Role) => {
    setRoles(prev => (prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]));
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setRoles(['passenger']);
    setFormError(null);
    setSubmitting(false);
  };

  const openNew = () => {
    resetForm();
    setShowNew(true);
  };

  const openEdit = (row: PersonRow) => {
    setEditRow(row);
    setFirstName(row.first_name ? row.first_name : '');
    setLastName(row.last_name ? row.last_name : '');
    // prefer DB formatted phone for display
    const digits = cleanUsPhone(row.phone ?? '');
    setPhone(formatUsPhone(digits));
    setEmail(row.email ?? '');
    const rs = (row.roles || []) as Role[];
    setRoles(rs.length ? rs : ['passenger']);
    setFormError(null);
  };

  const closeModals = () => {
    setShowNew(false);
    setEditRow(null);
    resetForm();
  };

  // Create
  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const fn = cleanName(firstName);
    const ln = cleanName(lastName);
    if (!fn) {
      setFormError('First name is required.');
      return;
    }
    let digits: string | null = null;
    if (phone.trim() !== '') {
      digits = cleanUsPhone(phone);
      if (!digits) {
        setFormError('Phone must be a valid US 10-digit number');
        return;
      }
    }

    setSubmitting(true);
    const { error } = await supabase.rpc('people_insert_with_roles_v2', {
      p_first_name: fn,
      p_last_name: ln || null,
      p_phone: phone.trim() === '' ? null : phone,
      p_email: email.trim() || null,
      p_roles: roles,
    });
    setSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }
    closeModals();
    await fetchPeople();
  };

  // Update
  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRow) return;
    setFormError(null);

    const fn = cleanName(firstName);
    const ln = cleanName(lastName);
    if (!fn) {
      setFormError('First name is required.');
      return;
    }
    if (phone.trim() !== '') {
      const ok = cleanUsPhone(phone);
      if (!ok) {
        setFormError('Phone must be a valid US 10-digit number');
        return;
      }
    }

    setSubmitting(true);
    const { error } = await supabase.rpc('people_update_with_roles_v1', {
      p_person_id: editRow.id,
      p_first_name: fn,
      p_last_name: ln || null,
      p_phone: phone.trim() === '' ? null : phone,
      p_email: email.trim() || null,
      p_roles: roles,
    });
    setSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }
    closeModals();
    await fetchPeople();
  };

  // Delete
  const deleteRow = async (row: PersonRow) => {
    if (!confirm(`Delete ${row.name || row.first_name || 'this person'}?`)) return;
    const { error } = await supabase.rpc('people_delete', { p_person_id: row.id });
    if (error) {
      alert(error.message);
      return;
    }
    await fetchPeople();
  };

  // Search & sort (client-side; fine for small data sets)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = people;
    if (q) {
      list = people.filter(p => {
        const hay = [
          p.first_name ?? '',
          p.last_name ?? '',
          p.name ?? '',
          p.email ?? '',
          p.phone ?? '',
          p.phone_formatted ?? '',
          p.roles_str ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }
    const byLast = (a: PersonRow, b: PersonRow) => {
      const la = (a.last_name || '').toLowerCase();
      const lb = (b.last_name || '').toLowerCase();
      if (la !== lb) return la < lb ? -1 : 1;
      const fa = (a.first_name || '').toLowerCase();
      const fb = (b.first_name || '').toLowerCase();
      return fa < fb ? -1 : fa > fb ? 1 : 0;
    };
    const byRole = (a: PersonRow, b: PersonRow) => {
      const ra = roleSortKey(a.roles || []);
      const rb = roleSortKey(b.roles || []);
      if (ra !== rb) return ra - rb;
      return byLast(a, b);
    };
    return [...list].sort(sortBy === 'role' ? byRole : byLast);
  }, [people, query, sortBy]);

  // UI bits
  const Toolbar = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <input
          className="rounded border px-3 py-2 w-64"
          placeholder="Search name, phone, email"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select
          className="rounded border px-2 py-2"
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'last' | 'role')}
          title="Sort"
        >
          <option value="last">Sort by last name</option>
          <option value="role">Sort by role (then last)</option>
        </select>
      </div>
      <button
        className="rounded px-3 py-2 border bg-black text-white"
        onClick={openNew}
      >
        New person
      </button>
    </div>
  );

  const Modal = ({
    title,
    onClose,
    onSubmit,
  }: {
    title: string;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
  }) => (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="px-2 py-1 rounded border" onClick={onClose}>
            Close
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">First name</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Last name (optional)</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
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
          </fieldset>

          {formError && <p className="text-red-700">{formError}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded px-3 py-2 border bg-black text-white disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="rounded px-3 py-2 border" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">People</h1>

      {!sessionChecked ? (
        <p>Checking login…</p>
      ) : !isLoggedIn ? (
        <div className="rounded-md border p-4 bg-yellow-50">
          <p className="font-medium">Please sign in first.</p>
        </div>
      ) : canSchedule === false ? (
        <div className="rounded-md border p-4 bg-red-50">
          <p className="font-medium text-red-700">Access denied.</p>
          <p className="text-sm opacity-70">
            Only <code>admin</code> or <code>scheduler</code> can manage people.
          </p>
        </div>
      ) : (
        <>
          {Toolbar}

          {loading ? (
            <p>Loading…</p>
          ) : errorMsg ? (
            <p className="text-red-700">Error: {errorMsg}</p>
          ) : (
            <div className="overflow-x-auto rounded border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Roles</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Email</th>
                    <th className="p-3 w-40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="p-3">
                        {(p.first_name || '') + (p.last_name ? ' ' + p.last_name : '')}
                      </td>
                      <td className="p-3">
                        {p.roles && p.roles.length
                          ? p.roles.join(', ')
                          : <span className="opacity-60">—</span>}
                      </td>
                      <td className="p-3">{p.phone_formatted || <span className="opacity-60">—</span>}</td>
                      <td className="p-3">{p.email || <span className="opacity-60">—</span>}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button className="rounded px-2 py-1 border" onClick={() => openEdit(p)}>
                            Edit
                          </button>
                          <button
                            className="rounded px-2 py-1 border text-red-700"
                            onClick={() => deleteRow(p)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td className="p-3 opacity-60" colSpan={5}>No people match your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* New modal */}
          {showNew && (
            <Modal title="New person" onClose={closeModals} onSubmit={submitNew} />
          )}

          {/* Edit modal */}
          {editRow && (
            <Modal
              title={`Edit: ${editRow.name || editRow.first_name || ''}`}
              onClose={closeModals}
              onSubmit={submitEdit}
            />
          )}
        </>
      )}
    </main>
  );
}
