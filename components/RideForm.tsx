// components/RideForm.tsx
"use client";

import React, { useEffect, useState } from "react";

export type RideEvent = {
  id?: string;
  date?: string | null;
  time?: string | null;
  status?: string | null;
  pilot_id?: string | null;
  passenger1_id?: string | null;
  passenger2_id?: string | null;
  emergency_contact_id?: string | null;
  pickup_location_id?: string | null;
  pre_ride_notes?: string | null;
  post_ride_notes?: string | null;
  locked?: boolean | null;
  canceled_reason?: string | null;
  start_at?: string | null;
};

type PersonOption = { id: string; display_name: string };
type PickupOption = { id: string; name: string; address?: string | null };

type PickersPayload = {
  pilots: PersonOption[];
  passengers: PersonOption[];
  emergencyContacts: PersonOption[];
};

export default function RideForm(props: {
  onCancel?: () => void;
  onSaved?: (rideId?: string) => void;
}) {
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [pilotId, setPilotId] = useState<string>(""); 
  const [p1Id, setP1Id] = useState<string>(""); 
  const [p2Id, setP2Id] = useState<string>(""); 
  const [ecId, setEcId] = useState<string>(""); 
  const [pickupId, setPickupId] = useState<string>(""); 
  const [notes, setNotes] = useState<string>(""); 

  const [pickers, setPickers] = useState<PickersPayload>({ pilots: [], passengers: [], emergencyContacts: [] });
  const [pickups, setPickups] = useState<PickupOption[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      setErr(null);
      const [a, b] = await Promise.all([
        fetch("/api/pickers/list", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/pickups/list", { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (!alive) return;
      setPickers(a);
      setPickups(b?.pickups ?? []);
    }
    load();
    return () => { alive = false; };
  }, []);

  const selectedIds = [pilotId, p1Id, p2Id, ecId].filter(Boolean) as string[];
  const filter = (list: PersonOption[], keep?: string) =>
    list.filter((o) => o.id === keep || !selectedIds.includes(o.id));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const payload = {
        date,
        ride_time: time,
        pickup_location_id: pickupId,
        emergency_contact_id: ecId,
        pilot_id: pilotId,
        passenger1_id: p1Id,
        passenger2_id: p2Id || null,
        pre_ride_notes: notes || null,
      };
      const resp = await fetch("/api/rides/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(j?.error || "Failed to save");
      props.onSaved?.(j?.id);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {err && <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">{err}</div>}
      <div className="grid md:grid-cols-3 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Date</span>
          <input type="date" className="border rounded px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Meeting time</span>
          <input type="time" className="border rounded px-3 py-2" value={time} onChange={(e) => setTime(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Pickup location</span>
          <select className="border rounded px-3 py-2" value={pickupId} onChange={(e) => setPickupId(e.target.value)} required>
            <option value="">Select a pickup</option>
            {pickups.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Pilot</span>
          <select className="border rounded px-3 py-2" value={pilotId} onChange={(e) => setPilotId(e.target.value)} required>
            <option value="">Select a pilot</option>
            {filter(pickers.pilots, pilotId).map((p) => (<option key={p.id} value={p.id}>{p.display_name}</option>))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Emergency contact</span>
          <select className="border rounded px-3 py-2" value={ecId} onChange={(e) => setEcId(e.target.value)} required>
            <option value="">Select emergency contact</option>
            {filter(pickers.emergencyContacts, ecId).map((p) => (<option key={p.id} value={p.id}>{p.display_name}</option>))}
          </select>
        </label>

        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-sm font-medium">Passenger 1</span>
          <select className="border rounded px-3 py-2" value={p1Id} onChange={(e) => setP1Id(e.target.value)} required>
            <option value="">Select passenger</option>
            {filter(pickers.passengers, p1Id).map((p) => (<option key={p.id} value={p.id}>{p.display_name}</option>))}
          </select>
        </label>

        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-sm font-medium">Passenger 2 (optional)</span>
          <select className="border rounded px-3 py-2" value={p2Id} onChange={(e) => setP2Id(e.target.value)}>
            <option value="">—</option>
            {filter(pickers.passengers, p2Id).map((p) => (<option key={p.id} value={p.id}>{p.display_name}</option>))}
          </select>
        </label>

        <label className="flex flex-col gap-1 md:col-span-3">
          <span className="text-sm font-medium">Pre-ride notes</span>
          <textarea className="border rounded px-3 py-2 min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>

      <div className="flex items-center gap-3 justify-end">
        <button type="button" className="px-4 py-2 rounded border" onClick={props.onCancel}>Cancel</button>
        <button type="submit" className="px-4 py-2 rounded bg-black text-white disabled:opacity-50" disabled={saving}>Save</button>
      </div>
    </form>
  );
}
