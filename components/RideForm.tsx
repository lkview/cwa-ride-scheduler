'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

const DEV = process.env.NEXT_PUBLIC_DEV_FAKE_AUTH === 'true';

type Id = string;
type Option = { id: Id; label: string };

export type RideEvent = {
  id?: Id;
  date: string;
  meeting_time: string;
  pickup_location_id: Id;
  emergency_contact_id: Id;
  pilot_id: Id;
  passenger1_id: Id;
  passenger2_id?: Id | null;
  pre_ride_notes?: string | null;
  status: 'Draft'|'Tentative'|'Confirmed'|'Completed'|'Canceled';
  locked?: boolean;
};

type Props = {
  initial?: Partial<RideEvent>;
  rideId?: Id | null;
};

async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function RideForm({ initial, rideId }: Props) {
  const router = useRouter();
  const [date, setDate] = useState(initial?.date ?? '');
  const [time, setTime] = useState(initial?.meeting_time?.slice(0,5) ?? '');
  const [pickup, setPickup] = useState<Id | ''>(initial?.pickup_location_id ?? '');
  const [ec, setEc] = useState<Id | ''>(initial?.emergency_contact_id ?? '');
  const [pilot, setPilot] = useState<Id | ''>(initial?.pilot_id ?? '');
  const [p1, setP1] = useState<Id | ''>(initial?.passenger1_id ?? '');
  const [p2, setP2] = useState<Id | ''>(initial?.passenger2_id ?? '');
  const [status, setStatus] = useState<RideEvent['status']>(initial?.status as any ?? 'Draft');
  const [notes, setNotes] = useState(initial?.pre_ride_notes ?? '');

  const [pilotOpts, setPilotOpts] = useState<Option[]>([]);
  const [passengerOpts, setPassengerOpts] = useState<Option[]>([]);
  const [pickupOpts, setPickupOpts] = useState<Option[]>([]);
  const [ecOpts, setEcOpts] = useState<Option[]>([]);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);

  // Load options
  useEffect(() => {
    (async () => {
      if (DEV) {
        const [pilots, passengers, pickups, ecs] = await Promise.all([
          getJSON<{data:any[]}>('/api/dev/list/pilots'),
          getJSON<{data:any[]}>('/api/dev/list/passengers'),
          getJSON<{data:any[]}>('/api/dev/list/pickup_locations'),
          getJSON<{data:any[]}>('/api/dev/list/emergency_contacts'),
        ]);
        setPilotOpts((pilots.data||[]).map(p=>({id:p.id,label:`${p.last_name}, ${p.first_name}`})));
        setPassengerOpts((passengers.data||[]).map(p=>({id:p.id,label:`${p.last_name}, ${p.first_name}`})));
        setPickupOpts((pickups.data||[]).map(p=>({id:p.id,label:p.name})));
        setEcOpts((ecs.data||[]).map(p=>({id:p.id,label:p.name})));
      } else {
        const [pilots, passengers, pickups, ecs] = await Promise.all([
          supabase.from('pilots').select('id, first_name, last_name').order('last_name'),
          supabase.from('passengers').select('id, first_name, last_name').order('last_name'),
          supabase.from('pickup_locations').select('id, name').order('name'),
          supabase.from('emergency_contacts').select('id, name').order('name'),
        ]);
        if (!pilots.error) setPilotOpts((pilots.data||[]).map(p=>({id:p.id,label:`${p.last_name}, ${p.first_name}`})));
        if (!passengers.error) setPassengerOpts((passengers.data||[]).map(p=>({id:p.id,label:`${p.last_name}, ${p.first_name}`})));
        if (!pickups.error) setPickupOpts((pickups.data||[]).map(p=>({id:p.id,label:p.name})));
        if (!ecs.error) setEcOpts((ecs.data||[]).map(p=>({id:p.id,label:p.name})));
      }
    })();
  }, []);

  const valid = useMemo(() => {
    return !!(date && time && pickup && ec && pilot && p1 && status);
  }, [date, time, pickup, ec, pilot, p1, status]);

  const checkConflicts = async () => {
    if (!valid) return ['Please complete all required fields.'];
    if (DEV) {
      const q = new URLSearchParams({
        date, time, pilot: String(pilot), p1: String(p1),
      });
      if (p2) q.set('p2', String(p2));
      if (rideId) q.set('exclude', rideId);
      const r = await getJSON<{ok:boolean; errors:string[] }>(`/api/dev/conflicts?${q.toString()}`);
      const msgs: string[] = [];
      if (!r.ok) msgs.push('A pilot or passenger is already booked at that time.');
      if (r.errors?.length) msgs.push(...r.errors);
      return msgs;
    }

    const problems: string[] = [];
    const mt = time.length === 5 ? time + ':00' : time;
    const neqId = rideId ?? '00000000-0000-0000-0000-000000000000';
    const fromRideEvents = (supabase as any).from('ride_events');
    const q = (col: string, val: string) =>
      fromRideEvents
        .select('id, date, meeting_time')
        .eq('date', date)
        .eq('meeting_time', mt)
        .eq(col as any, val)
        .neq('id', neqId)
        .limit(1);
    const queries: any[] = [
      q('pilot_id', String(pilot)),
      q('passenger1_id', String(p1)),
    ];
    if (p2) queries.push(q('passenger1_id', String(p2)));
    const q2 = (val: string) => fromRideEvents
      .select('id, date, meeting_time')
      .eq('date', date)
      .eq('meeting_time', mt)
      .eq('passenger2_id', val)
      .neq('id', neqId)
      .limit(1);
    queries.push(q2(String(p1)));
    if (p2) queries.push(q2(String(p2)));
    const results = await Promise.all(queries);
    if (results.some((r: any) => r.error)) {
      const e = results.find((r: any) => r.error)?.error?.message || 'Conflict check failed';
      problems.push(e);
    } else {
      const [pilotC, p1C, p2C1, p1C2, p2C2] = results as any[];
      if (pilotC?.data?.length) problems.push('Pilot is already booked at that time.');
      if (p1C?.data?.length || p1C2?.data?.length) problems.push('Passenger 1 is already booked at that time.');
      if (p2 && (p2C1?.data?.length || p2C2?.data?.length)) problems.push('Passenger 2 is already booked at that time.');
    }
    return problems;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setConflicts([]); setBusy(true);

    const problems = await checkConflicts();
    if (problems.length) { setConflicts(problems); setBusy(false); return; }

    const payload = {
      date,
      meeting_time: time.length===5? time+':00' : time,
      pickup_location_id: pickup,
      emergency_contact_id: ec,
      pilot_id: pilot,
      passenger1_id: p1,
      passenger2_id: p2 || null,
      pre_ride_notes: notes || null,
      status,
    };

    let error: any = null;
    if (DEV) {
      const url = rideId ? `/api/dev/ride-events/${rideId}` : '/api/dev/ride-events';
      const method = rideId ? 'PATCH' : 'POST';
      const r = await fetch(url, { method, body: JSON.stringify(payload), headers: { 'Content-Type':'application/json' }});
      if (!r.ok) error = await r.text();
    } else {
      const fromRideEvents = (supabase as any).from('ride_events');
      if (rideId) {
        const { error: e1 } = await fromRideEvents.update(payload).eq('id', rideId);
        error = e1 || null;
      } else {
        const { error: e2 } = await fromRideEvents.insert(payload);
        error = e2 || null;
      }
    }

    setBusy(false);
    if (error) { setErr(typeof error==='string' ? error : error.message); return; }
    router.push('/ride-events');
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-2xl">
      {DEV && <div className="p-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded text-sm">DEV MODE: using service API, auth bypassed.</div>}
      {conflicts.length > 0 && (
        <div className="p-3 border border-red-300 bg-red-50 text-red-700 rounded">
          <div className="font-semibold mb-1">Please fix these before saving:</div>
          <ul className="list-disc pl-5">
            {conflicts.map((c, i)=> <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}
      {err && <div className="p-3 border border-red-300 bg-red-50 text-red-700 rounded">{err}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm">Date *</span>
          <input type="date" className="border rounded px-3 py-2" value={date} onChange={e=>setDate(e.target.value)} required />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Meeting Time *</span>
          <input type="time" className="border rounded px-3 py-2" value={time} onChange={e=>setTime(e.target.value)} required />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Pickup Location *</span>
          <select className="border rounded px-3 py-2" value={pickup} onChange={e=>setPickup(e.target.value)} required>
            <option value="">Select…</option>
            {pickupOpts.map(o=> <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Emergency Contact *</span>
          <select className="border rounded px-3 py-2" value={ec} onChange={e=>setEc(e.target.value)} required>
            <option value="">Select…</option>
            {ecOpts.map(o=> <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Pilot *</span>
          <select className="border rounded px-3 py-2" value={pilot} onChange={e=>setPilot(e.target.value)} required>
            <option value="">Select…</option>
            {pilotOpts.map(o=> <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Passenger 1 *</span>
          <select className="border rounded px-3 py-2" value={p1} onChange={e=>setP1(e.target.value)} required>
            <option value="">Select…</option>
            {passengerOpts.map(o=> <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Passenger 2</span>
          <select className="border rounded px-3 py-2" value={p2} onChange={e=>setP2(e.target.value)}>
            <option value="">(none)</option>
            {passengerOpts.map(o=> <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Status *</span>
          <select className="border rounded px-3 py-2" value={status} onChange={e=>setStatus(e.target.value as any)} required>
            {['Draft','Tentative','Confirmed','Completed','Canceled'].map(s=>(
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Pre-ride Notes</span>
        <textarea className="border rounded px-3 py-2" value={notes} onChange={e=>setNotes(e.target.value)} rows={4} />
      </label>

      <div className="flex gap-2">
        <button disabled={busy || !valid} className="px-3 py-2 rounded bg-black text-white disabled:opacity-60">
          {busy ? 'Saving…' : 'Save Ride'}
        </button>
        <button type="button" onClick={()=>router.push('/ride-events')} className="px-3 py-2 rounded border">
          Cancel
        </button>
      </div>
    </form>
  );
}
