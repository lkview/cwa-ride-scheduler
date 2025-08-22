'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type RoleName = string; // we read names from DB, e.g. "pilot", "aspiring_pilot"

function titleCaseRole(role: RoleName) {
  return role
    .split('_')
    .map(s => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s))
    .join(' ');
}

export default function AddPersonPage() {
  const supabase = createClientComponentClient();
  const [access, setAccess] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  // form state
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [email,     setEmail]     = useState('');

  // roles state (dynamic)
  const [allRoles, setAllRoles] = useState<RoleName[]>([]);
  const [selected, setSelected] = useState<RoleName[]>([]);

  const canSave = useMemo(() => {
    return access === 'granted' && firstName.trim().length > 0;
  }, [access, firstName]);

  useEffect(() => {
    // Load available roles from DB (roles.name is the enum type)
    async function loadRoles() {
      const { data, error } = await supabase.from('roles').select('name').order('name');
      if (!error && data) {
        const names = data.map(r => String((r as any).name));
        setAllRoles(names);
        // default: pre-select "passenger" if present, to match prior behavior
        if (names.includes('passenger')) setSelected(['passenger']);
      }
    }
    loadRoles();
  }, [supabase]);

  async function checkAccess() {
    const { data, error } = await supabase.rpc('can_schedule_rides');
    if (error) {
      setAccess('denied');
      return;
    }
    setAccess(data ? 'granted' : 'denied');
  }

  async function onSave() {
    if (!canSave) return;

    const { data, error } = await supabase.rpc('people_insert_with_roles_v2', {
      p_first_name: firstName,
      p_last_name: lastName,
      p_phone_input: phone,
      p_email_input: email,
      p_roles: selected,
    });

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    // Optional: clear + show formatted phone if server normalized it on reload
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setSelected([]);
    alert('Person saved.');
  }

  function toggleRole(role: RoleName) {
    setSelected(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-6">Add Person (Admin/Scheduler)</h1>

      <div className="rounded border p-4 mb-6">
        <button
          className="rounded bg-black px-3 py-2 text-white"
          onClick={checkAccess}
        >
          Check admin/scheduler access
        </button>
        <span className="ml-3 align-middle">
          Access:{' '}
          {access === 'unknown' ? '—' : access === 'granted' ? 'TRUE' : 'FALSE'}
        </span>
        <div className="text-sm text-gray-500 mt-1">
          (This calls <code>can_schedule_rides()</code> in the database.)
        </div>
      </div>

      <div className="rounded border p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium">First name</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="Jane"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Last name (optional)</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="Doe"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Phone (optional)</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(555) 555-1212"
              inputMode="tel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email (optional)</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.org"
              inputMode="email"
            />
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-2">Roles</div>
          {allRoles.length === 0 ? (
            <div className="text-sm text-gray-500">Loading roles…</div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {allRoles.map(role => (
                <label key={role} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selected.includes(role)}
                    onChange={() => toggleRole(role)}
                  />
                  <span>{titleCaseRole(role)}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            className={`rounded px-4 py-2 text-white ${
              canSave ? 'bg-black' : 'bg-gray-400'
            }`}
            disabled={!canSave}
            onClick={onSave}
          >
            Save person
          </button>
        </div>

        <div className="text-xs text-gray-500">
          This uses the DB function <code>people_insert_with_roles_v2</code> we created.
          Only <em>admin</em> or <em>scheduler</em> can succeed.
        </div>
      </div>
    </div>
  );
}
