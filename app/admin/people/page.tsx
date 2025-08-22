'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type PersonRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  people_roles: { role: string }[];
};

type ModalState =
  | { mode: 'new'; open: true }
  | { mode: 'edit'; open: true; person: PersonRow }
  | { open: false };

const AVAILABLE_ROLE_LABELS: Record<string, string> = {
  pilot: 'Pilot',
  passenger: 'Passenger',
  emergency_contact: 'Emergency Contact',
  aspiring_pilot: 'Aspiring Pilot',
};

const titleCaseRole = (value: string) =>
  value
    .split('_')
    .map(w => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');

const cleanPhone = (v: string | null | undefined) => {
  if (!v) return null;
  const digits = v.replace(/\D/g, '');
  return digits.length ? digits : null;
};

const formatPhone = (v: string | null | undefined) => {
  if (!v) return '—';
  const digits = v.replace(/\D/g, '');
  if (digits.length !== 10) return v;
  const area = digits.slice(0,3);
  const mid = digits.slice(3,6);
  const last = digits.slice(6);
  return `(${area}) ${mid}-${last}`;
};

function useSupabase(): SupabaseClient {
  const client = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key);
  }, []);
  return client;
}

export default function PeoplePage() {
  const supabase = useSupabase();

  const [people, setPeople] = useState<PersonRow[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'last' | 'role'>('last');

  const [modal, setModal] = useState<ModalState>({ open: false });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [rolesRes, rosterRes] = await Promise.all([
          fetch('/api/roles', { cache: 'no-store' }),
          fetch('/api/people/roster', { cache: 'no-store' }),
        ]);

        const rolesJson = await rolesRes.json();
        const rosterJson = await rosterRes.json();

        if (!cancelled) {
          const rolesList = Array.isArray(rolesJson?.rows) ? rolesJson.rows.map((r:any) => r.name) : [];
          setRoles(rolesList);

          const rows = Array.isArray(rosterJson?.rows) ? rosterJson.rows : [];
          const mapped: PersonRow[] = rows.map((r:any) => ({
            id: r.id,
            first_name: r.first_name ?? null,
            last_name: r.last_name ?? null,
            phone: r.phone ?? null,
            email: r.email ?? null,
            people_roles: Array.isArray(r.roles) ? r.roles.map((role:string) => ({ role })) : [],
          }));
          setPeople(mapped);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const base = people.map(p => ({
      ...p,
      rolesList: (p.people_roles ?? []).map(r => r.role),
      last: (p.last_name ?? '').toLowerCase(),
      name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
    }));

    const searched = q
      ? base.filter(p =>
          [
            p.name.toLowerCase(),
            p.phone?.toLowerCase() ?? '',
            p.email?.toLowerCase() ?? '',
            ...p.rolesList.map(r => r.toLowerCase()),
          ].some(s => s.includes(q)),
        )
      : base;

    if (sortBy === 'role') {
      return searched.sort((a, b) => {
        const ra = (a.rolesList[0] ?? '').localeCompare(b.rolesList[0] ?? '');
        if (ra !== 0) return ra;
        return (a.last ?? '').localeCompare(b.last ?? '');
      });
    }
    return searched.sort((a, b) => (a.last ?? '').localeCompare(b.last ?? ''));
  }, [people, query, sortBy]);

  const refresh = async () => {
    const res = await fetch('/api/people/roster', { cache: 'no-store' });
    const json = await res.json();
    const rows = Array.isArray(json?.rows) ? json.rows : [];
    const mapped: PersonRow[] = rows.map((r:any) => ({
      id: r.id,
      first_name: r.first_name ?? null,
      last_name: r.last_name ?? null,
      phone: r.phone ?? null,
      email: r.email ?? null,
      people_roles: Array.isArray(r.roles) ? r.roles.map((role:string) => ({ role })) : [],
    }));
    setPeople(mapped);
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this person?')) return;
    const { error } = await supabase.rpc('people_delete', { p_person_id: id });
    if (error) {
      alert(error.message);
    } else {
      await refresh();
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold mb-4">People</h1>

      <div className="flex gap-3 mb-4">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search name, phone, email"
          className="flex-1 rounded border px-3 py-2"
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="rounded border px-3 py-2"
        >
          <option value="last">Sort by last name</option>
          <option value="role">Sort by role</option>
        </select>

        <button
          className="ml-auto rounded bg-black px-4 py-2 text-white"
          onClick={() => setModal({ mode: 'new', open: true })}
        >
          New person
        </button>
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Roles</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-3" colSpan={5}>
                  Loading…
                </td>
              </tr>
            ) : filtered.length ? (
              filtered.map(p => {
                const displayRoles = (p.people_roles ?? [])
                  .map(r => titleCaseRole(r.role))
                  .join(', ');
                const fullName = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();

                return (
                  <tr key={p.id} className="border-t">
                    <td className="px-3 py-2">{fullName || '—'}</td>
                    <td className="px-3 py-2">{displayRoles || '—'}</td>
                    <td className="px-3 py-2">{formatPhone(p.phone)}</td>
                    <td className="px-3 py-2">{p.email ?? '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          className="rounded border px-3 py-1 text-sm"
                          onClick={() => setModal({ mode: 'edit', open: true, person: p })}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded border px-3 py-1 text-sm"
                          onClick={() => onDelete(p.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-3 py-3" colSpan={5}>
                  No people found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <PersonModal
          supabase={supabase}
          roles={roles}
          mode={(modal as any).mode ?? 'new'}
          person={(modal as any).person}
          onClose={() => setModal({ open: false })}
          onSaved={async () => {
            setModal({ open: false });
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function PersonModal({
  supabase,
  roles,
  mode,
  person,
  onClose,
  onSaved,
}: {
  supabase: SupabaseClient;
  roles: string[];
  mode: 'new' | 'edit';
  person?: PersonRow;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [first, setFirst] = useState(person?.first_name ?? '');
  const [last, setLast] = useState(person?.last_name ?? '');
  const [phone, setPhone] = useState(person?.phone ?? '');
  const [email, setEmail] = useState(person?.email ?? '');
  const [selected, setSelected] = useState<string[]>(
    person ? (person.people_roles ?? []).map(r => r.role) : [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (r: string) =>
    setSelected(prev => (prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]));

  const onSubmit = async () => {
    setError(null);

    if (!first.trim()) {
      setError('First name is required.');
      return;
    }
    const payload = {
      p_first_name: first.trim(),
      p_last_name: last.trim() || null,
      p_phone: cleanPhone(phone),
      p_email: email.trim() || null,
      p_roles: selected,
    };

    setSaving(true);

    const res =
      mode === 'new'
        ? await supabase.rpc('people_insert_with_roles_v2', payload as any)
        : await supabase.rpc('people_update_with_roles_v2', {
            p_person_id: person!.id,
            ...payload,
          } as any);

    setSaving(false);

    if (res.error) {
      setError(res.error.message);
      return;
    }

    await onSaved();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">
          {mode === 'new' ? 'New person' : `Edit: ${(person?.first_name ?? '') + ' ' + (person?.last_name ?? '')}`}
        </h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">First name</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={first}
              onChange={e => setFirst(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Last name (optional)</label>
            <input className="w-full rounded border px-3 py-2" value={last} onChange={e => setLast(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Phone (optional)</label>
            <input className="w-full rounded border px-3 py-2" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Email (optional)</label>
            <input className="w-full rounded border px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 text-sm">Roles</div>
          <div className="flex flex-wrap gap-4">
            {roles.map(r => (
              <label key={r} className="flex items-center gap-2">
                <input type="checkbox" checked={selected.includes(r)} onChange={() => toggle(r)} />
                <span>{AVAILABLE_ROLE_LABELS[r] ?? titleCaseRole(r)}</span>
              </label>
            ))}
          </div>
        </div>

        {error && <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="mt-6 flex items-center gap-3">
          <button className="rounded bg-black px-4 py-2 text-white disabled:opacity-50" onClick={onSubmit} disabled={saving}>
            Save
          </button>
          <button className="rounded border px-4 py-2" onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
