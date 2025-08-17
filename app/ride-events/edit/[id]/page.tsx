'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import RoleGate from '../../../../components/RoleGate';
import RideForm, { RideEvent } from '../../../../components/RideForm';
import { supabase } from '../../../../lib/supabaseClient';

export default function EditRidePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [initial, setInitial] = useState<Partial<RideEvent> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('ride_events')
        .select('id, date, meeting_time, pickup_location_id, emergency_contact_id, pilot_id, passenger1_id, passenger2_id, pre_ride_notes, status, locked')
        .eq('id', id)
        .maybeSingle();
      if (error) setErr(error.message);
      setInitial(data || null);
      setLoading(false);
    })();
  }, [id]);

  return (
    <RoleGate allow={['admin','scheduler']}>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Edit Ride</h1>
        {loading && <div>Loading…</div>}
        {err && <div className="text-red-600">{err}</div>}
        {initial && initial.locked ? (
          <div className="p-3 border rounded bg-yellow-50 text-yellow-800">This ride is locked and cannot be edited.</div>
        ) : initial ? (
          <RideForm initial={initial} rideId={id} />
        ) : !loading && !err ? (
          <div className="text-red-600">Ride not found.</div>
        ) : null}
      </div>
    </RoleGate>
  );
}
