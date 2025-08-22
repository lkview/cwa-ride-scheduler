// app/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type RideRow = {
  id: string;
  ride_date: string; // ISO date
  title: string | null;
  notes: string | null;
};

function useSupabase(): SupabaseClient {
  return useMemo(() => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);
}

async function authHeaders(supabase: SupabaseClient): Promise<HeadersInit | undefined> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined;
}

const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

export default function RidesHomePage() {
  const supabase = useSupabase();
  const [rows, setRows] = useState<RideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders(supabase);
      const res = await fetch('/api/rides/list', { cache: 'no-store', headers });
      if (res.status === 401) setError('Please sign in to view rides.');
      const json = await res.json().catch(() => ({} as any));
      const r = Array.isArray((json as any).rows) ? (json as any).rows : [];
      setRows(r);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, RideRow[]>();
    for (const r of rows) {
      const key = r.ride_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries()).sort(([a],[b]) => a.localeCompare(b));
  }, [rows]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Rides</h1>
        <button className="ml-auto rounded bg-black px-4 py-2 text-white" onClick={() => setModalOpen(true)}>
          New ride
        </button>
      </div>

      {error && <div className="mb-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="space-y-6">
        {loading ? (
          <div>Loading…</div>
        ) : grouped.length === 0 ? (
          <div className="rounded border bg-white p-4">No rides scheduled.</div>
        ) : (
          grouped.map(([date, items]) => (
            <section key={date} className="rounded border bg-white">
              <div className="border-b bg-gray-50 px-4 py-2 font-medium">{fmt.format(new Date(date))}</div>
              <ul className="divide-y">
                {items.map((r) => (
                  <li key={r.id} className="px-4 py-3">
                    <div className="font-medium">{r.title || 'Untitled ride'}</div>
                    {r.notes && <div className="text-sm text-gray-600">{r.notes}</div>}
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      {modalOpen && <NewRideModal supabase={supabase} onClose={() => setModalOpen(false)} onSaved={async () => { setModalOpen(false); await load(); }} />}
    </div>
  );
}

function NewRideModal({ supabase, onClose, onSaved }: { supabase: SupabaseClient; onClose: () => void; onSaved: () => void | Promise<void>; }) {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!date) { setError('Please choose a date.'); return; }
    setSaving(true);
    const headers = await authHeaders(supabase);
    const res = await fetch('/api/rides/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
      body: JSON.stringify({ ride_date: date, title: title.trim() || null, notes: notes.trim() || null }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({} as any));
      setError(j?.error ?? 'Create failed');
      return;
    }
    await onSaved();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">New ride</h2>

        <div className="grid gap-3">
          <div>
            <label className="mb-1 block text-sm">Date</label>
            <input type="date" className="w-full rounded border px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Title (optional)</label>
            <input className="w-full rounded border px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Notes (optional)</label>
            <textarea className="w-full rounded border px-3 py-2" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        {error && <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="mt-6 flex items-center gap-3">
          <button className="rounded bg-black px-4 py-2 text-white disabled:opacity-50" onClick={onSubmit} disabled={saving}>Save</button>
          <button className="rounded border px-4 py-2" onClick={onClose} disabled={saving}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
