'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type RosterRow = {
  id: string;
  first_name: string;
  last_name: string;
  roles: string[];
  roles_title: string;
  phone: string | null;
  email: string | null;
};

type RideRow = {
  id: string;
  ride_ts: string; // ISO
  status: string;
  title: string | null;
  notes: string | null;
  pilot_id: string | null;
  pilot_name: string | null;
  passenger1_id: string | null;
  passenger1_name: string | null;
  passenger2_id: string | null;
  passenger2_name: string | null;
  emergency_contact_id: string | null;
  emergency_contact_name: string | null;
};

function useSupabase(): SupabaseClient {
  return useMemo(() => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);
}

async function authHeaders(supabase: SupabaseClient): Promise<HeadersInit | undefined> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined;
}

function nameOf(p: RosterRow | null | undefined) {
  if (!p) return '';
  const first = p.first_name || '';
  const last = p.last_name || '';
  return (first + ' ' + last).trim();
}

function clampToHalfHour(t: string): string {
  if (!t) return t;
  const parts = t.split(':');
  if (parts.length < 2) return t;
  const hh = parts[0].padStart(2, '0');
  const mm = parseInt(parts[1] || '0', 10);
  const clamped = mm < 15 ? '00' : (mm < 45 ? '30' : '00');
  const hourAdj = (mm >= 45) ? String((parseInt(hh,10)+1)%24).padStart(2,'0') : hh;
  return `${hourAdj}:${clamped}`;
}

export default function HomePage() {
  const supabase = useSupabase();
  const [rides, setRides] = useState<RideRow[]>([]);
  const [people, setPeople] = useState<RosterRow[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [show, setShow] = useState(false);
  const [rideDate, setRideDate] = useState<string>('');
  const [rideTime, setRideTime] = useState<string>('09:00');
  const [title, setTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [pilotId, setPilotId] = useState<string>('');
  const [p1Id, setP1Id] = useState<string>('');
  const [p2Id, setP2Id] = useState<string>('');
  const [ecId, setEcId] = useState<string>('');
  const [status, setStatus] = useState<string>('scheduled');
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const pilots = useMemo(() => people.filter(p => p.roles?.includes('pilot')), [people]);
  const ecs = useMemo(() => people.filter(p => p.roles?.includes('emergency_contact')), [people]);
  const passengers1 = useMemo(() => people.filter(p => p.id !== pilotId), [people, pilotId]);
  const passengers2 = useMemo(() => people.filter(p => p.id !== pilotId && p.id !== p1Id), [people, pilotId, p1Id]);

  async function refreshAll() {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders(supabase);
      const [r1,r2,r3] = await Promise.all([
        fetch('/api/rides/list', { cache: 'no-store', headers }),
        fetch('/api/people/roster', { cache: 'no-store', headers }),
        fetch('/api/rides/statuses', { cache: 'no-store', headers }),
      ]);
      const ridesJson = await r1.json();
      const peopleJson = await r2.json();
      const statusesJson = await r3.json();
      const s = (statusesJson.rows ?? []).filter((x:string) => x.toLowerCase() !== 'planned');
      setStatuses(s);
      setStatus('scheduled');
      setRides(ridesJson.rows ?? []);
      setPeople(peopleJson.rows ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshAll(); }, []);

  const grouped = useMemo(() => {
    const m = new Map<string, RideRow[]>();
    for (const r of rides) {
      const d = new Date(r.ride_ts);
      const key = d.toLocaleDateString();
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(r);
    }
    for (const arr of m.values()) {
      arr.sort((a,b) => new Date(a.ride_ts).getTime() - new Date(b.ride_ts).getTime());
    }
    return Array.from(m.entries()).sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  }, [rides]);

  async function saveRide() {
    setSaveErr(null);
    if (!rideDate || !rideTime || !p1Id || !pilotId || !ecId || !status) {
      setSaveErr('Please fill date, time, pilot, passenger 1, emergency contact, and status.');
      return;
    }
    if (p1Id === pilotId || p2Id === pilotId || (p2Id && p2Id === p1Id)) {
      setSaveErr('Pilot and passengers must be different people.');
      return;
    }
    setSaving(true);
    try {
      const headers = await authHeaders(supabase);
      const timeClamped = clampToHalfHour(rideTime);
      const res = await fetch('/api/rides/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
        body: JSON.stringify({
          ride_date: rideDate, ride_time: timeClamped,
          title, notes,
          pilot_id: pilotId, passenger1_id: p1Id, passenger2_id: p2Id || null,
          emergency_contact_id: ecId, status
        })
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j.error || `Save failed (${res.status})`);
      }
      setShow(false);
      setRideDate(''); setRideTime('09:00'); setTitle(''); setNotes('');
      setPilotId(''); setP1Id(''); setP2Id(''); setEcId(''); setStatus('scheduled');
      await refreshAll();
    } catch (e:any) {
      setSaveErr(e.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function personOption(p: RosterRow) {
    return <option key={p.id} value={p.id}>{nameOf(p)} {p.roles_title ? `– ${p.roles_title}` : ''}</option>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Rides</h1>
        <button onClick={() => setShow(true)} className="px-4 py-2 rounded-md bg-black text-white hover:bg-zinc-800">New ride</button>
      </div>

      {loading ? <div>Loading…</div> : error ? <div className="text-red-600">{error}</div> : (
        grouped.length === 0 ? <div className="text-zinc-600">No rides scheduled.</div> : (
          <div className="space-y-8">
            {grouped.map(([date, arr]) => (
              <div key={date}>
                <h2 className="text-xl font-semibold mb-2">{date}</h2>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-zinc-50">
                      <tr className="text-left">
                        <th className="p-3">Time</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Pilot</th>
                        <th className="p-3">Passengers</th>
                        <th className="p-3">Emergency Contact</th>
                        <th className="p-3">Title</th>
                      </tr>
                    </thead>
                    <tbody>
                      {arr.map(r => {
                        const t = new Date(r.ride_ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        return (
                          <tr key={r.id} className="border-t">
                            <td className="p-3">{t}</td>
                            <td className="p-3 capitalize">{r.status}</td>
                            <td className="p-3">{r.pilot_name}</td>
                            <td className="p-3">{[r.passenger1_name, r.passenger2_name].filter(Boolean).join(', ')}</td>
                            <td className="p-3">{r.emergency_contact_name}</td>
                            <td className="p-3">{r.title ?? ''}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {show && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold">New ride</h3>
              <button onClick={() => setShow(false)} className="text-zinc-500 hover:text-black">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input type="date" value={rideDate} onChange={e=>setRideDate(e.target.value)} className="w-full rounded-md border p-2"/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input type="time" step={1800} value={rideTime} onChange={e=>setRideTime(e.target.value)} className="w-full rounded-md border p-2"/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select value={status} onChange={e=>setStatus(e.target.value)} className="w-full rounded-md border p-2 capitalize">
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Pilot</label>
                  <select value={pilotId} onChange={e=>{ setPilotId(e.target.value); if (e.target.value === p1Id) setP1Id(''); if (e.target.value === p2Id) setP2Id(''); }} className="w-full rounded-md border p-2">
                    <option value="">Select a pilot</option>
                    {pilots.map(personOption)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Emergency Contact</label>
                  <select value={ecId} onChange={e=>setEcId(e.target.value)} className="w-full rounded-md border p-2">
                    <option value="">Select emergency contact</option>
                    {ecs.map(personOption)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Passenger 1</label>
                  <select value={p1Id} onChange={e=>{ setP1Id(e.target.value); if (e.target.value === p2Id) setP2Id(''); }} className="w-full rounded-md border p-2">
                    <option value="">Select passenger</option>
                    {passengers1.map(personOption)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Passenger 2 (optional)</label>
                  <select value={p2Id} onChange={e=>setP2Id(e.target.value)} className="w-full rounded-md border p-2" disabled={!p1Id}>
                    <option value="">— None —</option>
                    {passengers2.map(personOption)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                  <textarea rows={4} value={notes} onChange={e=>setNotes(e.target.value)} className="w-full rounded-md border p-2" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title (optional)</label>
                  <input type="text" value={title} onChange={e=>setTitle(e.target.value)} className="w-full rounded-md border p-2"/>
                </div>
              </div>

              {saveErr && <div className="text-red-600">{saveErr}</div>}
            </div>
            <div className="p-5 border-t flex items-center justify-end gap-2">
              <button onClick={() => setShow(false)} className="px-3 py-2 rounded-md border border-zinc-300 hover:bg-zinc-100">Cancel</button>
              <button onClick={saveRide} disabled={saving} className="px-4 py-2 rounded-md bg-black text-white hover:bg-zinc-800 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
