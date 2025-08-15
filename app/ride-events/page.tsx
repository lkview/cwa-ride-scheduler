'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AuthGate from '../../components/AuthGate';

type Ride = {
  id: string;
  date: string;
  meeting_time: string;
  status: string;
  locked: boolean;
  pilot_id: string;
  passenger1_id: string;
  passenger2_id: string | null;
  pickup_location_id: string;
  emergency_contact_id: string;
};

type Dict = Record<string, string>;

export default function RideEventsPage() {
  const [rows, setRows] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [pilotMap, setPilotMap] = useState<Dict>({});
  const [passengerMap, setPassengerMap] = useState<Dict>({});
  const [pickupMap, setPickupMap] = useState<Dict>({});
  const [ecMap, setEcMap] = useState<Dict>({});

  useEffect(() => {
    (async () => {
      const [rides, pilots, passengers, pickups, ecs] = await Promise.all([
        supabase.from('ride_events').select('id,date,meeting_time,status,locked,pilot_id,passenger1_id,passenger2_id,pickup_location_id,emergency_contact_id').order('date', { ascending: false }),
        supabase.from('pilots').select('id, first_name, last_name'),
        supabase.from('passengers').select('id, first_name, last_name'),
        supabase.from('pickup_locations').select('id, name'),
        supabase.from('emergency_contacts').select('id, name'),
      ]);

      if (rides.error) { setErr(rides.error.message); setLoading(false); return; }
      setRows(rides.data || []);

      const pMap: Dict = Object.fromEntries((pilots.data || []).map(p => [p.id, `${p.last_name}, ${p.first_name}`]));
      const paMap: Dict = Object.fromEntries((passengers.data || []).map(p => [p.id, `${p.last_name}, ${p.first_name}`]));
      const plMap: Dict = Object.fromEntries((pickups.data || []).map(p => [p.id, p.name]));
      const eMap: Dict = Object.fromEntries((ecs.data || []).map(e => [e.id, e.name]));

      setPilotMap(pMap); setPassengerMap(paMap); setPickupMap(plMap); setEcMap(eMap);
      setLoading(false);
    })();
  }, []);

  const fmt = (d: string, t: string) => {
    try {
      const dt = new Date(`${d}T${t}`);
      return dt.toLocaleString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
      });
    } catch { return `${d} ${t}`; }
  };

  return (
    <AuthGate>
      <h1 className="text-xl font-semibold mb-3">Ride Events</h1>
      {loading && <div>Loading…</div>}
      {err && <div className="text-red-600">{err}</div>}
      {!loading && !err && (
        <div className="overflow-x-auto rounded border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Pilot</th>
                <th className="px-3 py-2">Passenger(s)</th>
                <th className="px-3 py-2">Pickup</th>
                <th className="px-3 py-2">Emergency Contact</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Locked</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 whitespace-nowrap">{fmt(r.date, r.meeting_time)}</td>
                  <td className="px-3 py-2">{pilotMap[r.pilot_id] ?? '—'}</td>
                  <td className="px-3 py-2">
                    {passengerMap[r.passenger1_id] ?? '—'}
                    {r.passenger2_id ? `; ${passengerMap[r.passenger2_id] ?? '—'}` : ''}
                  </td>
                  <td className="px-3 py-2">{pickupMap[r.pickup_location_id] ?? '—'}</td>
                  <td className="px-3 py-2">{ecMap[r.emergency_contact_id] ?? '—'}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2">{r.locked ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AuthGate>
  );
}
