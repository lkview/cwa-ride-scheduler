// app/ride-events/edit/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RideForm, { RideEvent } from "../../../../components/RideForm";

export default function EditRidePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [initial, setInitial] = useState<Partial<RideEvent> | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const j = await fetch(`/api/rides/${id}`, { cache: "no-store" }).then((r) => r.json());
        if (j?.error) throw new Error(j.error);
        const ride = j.ride as any;
        const mapped: Partial<RideEvent> = {
          id: ride.id,
          date: ride.date,
          time: ride.meeting_time,
          status: ride.status,
          pilot_id: ride.pilot_id,
          passenger1_id: ride.passenger1_id,
          passenger2_id: ride.passenger2_id,
          emergency_contact_id: ride.emergency_contact_id,
          pickup_location_id: ride.pickup_location_id,
          pre_ride_notes: ride.pre_ride_notes,
          post_ride_notes: ride.post_ride_notes,
        };
        if (!alive) return;
        setInitial(mapped);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load ride");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [id]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Edit Ride</h1>
      {err && <div className="mb-4 rounded bg-red-50 text-red-700 px-3 py-2 text-sm">{err}</div>}
      {loading ? <div>Loading…</div> : initial ? (
        <RideForm initial={initial} rideId={id} onSaved={() => router.push("/")} onCancel={() => router.push("/")} />
      ) : <div>Ride not found.</div>}
    </div>
  );
}
