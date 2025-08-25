"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import RoleGate from "../../../../components/RoleGate";
import RideForm from "../../../../components/RideForm";

type RideDetail = {
  id: string;
  date: string;
  meeting_time: string | null;
  status: string;
  pickup_location_id: string | null;
  emergency_contact_id: string | null;
  pilot_id: string | null;
  passenger1_id: string | null;
  passenger2_id: string | null;
  pre_ride_notes: string | null;
};

export default function EditRidePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [initial, setInitial] = useState<Partial<RideDetail> | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/rides/${id}`, { cache: "no-store" });
        const j = await res.json();
        if (!alive) return;
        if (!res.ok) throw new Error(j?.error || "Failed to load ride");
        // The API returns { ride } with fields we need
        setInitial(j.ride as RideDetail);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Failed to load ride");
      } finally {
        if (alive) setLoading(false);
      }
    }
    if (id) run();
    return () => { alive = false; };
  }, [id]);

  return (
    <RoleGate>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Edit Ride</h1>
        {loading && <div>Loading…</div>}
        {err && <div className="text-red-600">{err}</div>}
        {!loading && !err && initial && (
          <RideForm rideId={id} initial={initial} />
        )}
      </div>
    </RoleGate>
  );
}
