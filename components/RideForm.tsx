'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

type Id = string;
type Option = { id: Id; label: string };

export type RideEvent = {
  id?: Id;
  date: string;            // YYYY-MM-DD
  meeting_time: string;    // HH:MM
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
    })();
  }, []);

  const valid = useMemo(() => {
    return !!(date && time && pickup && ec && pilot && p1 && status);
  }, [date, time, pickup, ec, pilot, p1, status]);

  const checkConflicts = async () => {
    if (!valid) return ['Please complete all required fields.'];
    const problems: string[] = [];
    const mt = time.length === 5 ? time + ':00' : time;

    const neqId = rideId ?? '00000000-0000-0000-0000-000000000000';

    const q = (col: string, val: string) =>
      supabase.from('ride_events')
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

    if (p2) {
      queries.push(q('passenger1_id', String(p2)));
    }
    // Also check passenger2 column for either p1 or p2
    const q2 = (val: string) => supabase.from('ride_events')
      .select('id, date, meeting_time')
      .eq('date', date)
      .eq('meeting_time', mt)
      .eq('passenger2_id', val)
      .neq('id', neqId)
      .limit(1);
    queries.push(q2(String(p1)));
    if (p2) queries.push(q2(String(p2)));

    const results = await Promise.all(queries);
    if (results.some(r => r.error)) {
      const e = results.find(r => r.error)?.error?.message || 'Conflict check failed';
      problems.push(e);
    } else {
      const [pilotC, p1C, p2C1, p1C2, p2C2] = results;
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

    let error;
    if (rideId) {
      const { error: e } = await supabase.from('ride_events').update(payload).eq('id', rideId);
      error = e || null;
    } else {
      const { error: e } = await supabase.from('ride_events').insert(payload);
      error = e || null;
    }

    setBusy(false);
    if (error) { setErr(error.message); return; }
    router.push('/ride-events');
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-2xl">
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
