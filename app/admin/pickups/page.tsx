'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type PickupRow = { id: string; name: string };

function useSupabase(): SupabaseClient {
  return useMemo(() => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);
}

async function authHeaders(supabase: SupabaseClient): Promise<HeadersInit | undefined> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined;
}

export default function PickupsPage() {
  const supabase = useSupabase();
  const [rows, setRows] = useState<PickupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders(supabase);
      const res = await fetch('/api/pickups/list', { cache: 'no-store', headers });
      const j = await res.json();
      setRows(j.rows ?? []);
    } catch (e:any) {
      setError(e.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openNew() { setEditId(null); setName(''); setShow(true); setSaveErr(null); }
  function openEdit(row: PickupRow) { setEditId(row.id); setName(row.name); setShow(true); setSaveErr(null); }

  async function onSave() {
    setSaveErr(null);
    if (!name.trim()) { setSaveErr('Name is required.'); return; }
    setSaving(true);
    try {
      const headers = await authHeaders(supabase);
      const path = editId ? '/api/pickups/update' : '/api/pickups/create';
      const body: any = { name: name.trim() };
      if (editId) body.id = editId;
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j.error || 'Save failed');
      }
      setShow(false);
      await load();
    } catch (e:any) {
      setSaveErr(e.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row: PickupRow) {
    if (!confirm(`Delete pickup location "${row.name}"?`)) return;
    const headers = await authHeaders(supabase);
    const res = await fetch('/api/pickups/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
      body: JSON.stringify({ id: row.id })
    });
    if (!res.ok) {
      const j = await res.json().catch(()=>({}));
      alert(j.error || 'Delete failed');
    } else {
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pickup Locations</h1>
        <button onClick={openNew} className="px-4 py-2 rounded-md bg-black text-white hover:bg-zinc-800">New pickup</button>
      </div>

      {loading ? <div>Loading…</div> : error ? <div className="text-red-600">{error}</div> : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-50">
              <tr className="text-left">
                <th className="p-3">Name</th>
                <th className="p-3 w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td className="p-3 text-zinc-600" colSpan={2}>No pickup locations.</td></tr>
              ) : rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(r)} className="px-2 py-1 rounded border border-zinc-300 hover:bg-zinc-100 text-sm">Edit</button>
                      <button onClick={() => onDelete(r)} className="px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50 text-sm">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {show && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editId ? 'Edit pickup' : 'New pickup'}</h3>
              <button onClick={() => setShow(false)} className="text-zinc-500 hover:text-black">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-md border p-2" placeholder="e.g., Central Park East"/>
              </div>
              {saveErr && <div className="text-red-600">{saveErr}</div>}
            </div>
            <div className="p-5 border-t flex items-center justify-end gap-2">
              <button onClick={() => setShow(false)} className="px-3 py-2 rounded-md border border-zinc-300 hover:bg-zinc-100">Cancel</button>
              <button onClick={onSave} disabled={saving} className="px-4 py-2 rounded-md bg-black text-white hover:bg-zinc-800 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
