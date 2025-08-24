// components/RideForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

type RideFormProps = {
  rideId?: string;
  initial?: Partial<RideEvent>;
  onCancel?: () => void;
  onSaved?: (rideId?: string) => void;
};

const STATUS_OPTIONS = ["Tentative", "Confirmed", "Completed", "Canceled"];

function buildTimes(): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  for (let h = 7; h <= 20; h++) {
    for (let m of [0, 30]) {
      const value = `${pad(h)}:${pad(m)}:00`; // HH:MM:SS
      const dt = new Date();
      dt.setHours(h, m, 0, 0);
      const label = dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      out.push({ value, label });
    }
  }
  return out;
}
const TIME_OPTIONS = buildTimes();

export default function RideForm(props: RideFormProps) {
  const router = useRouter();
  const init = props.initial ?? {};

  const [date, setDate] = useState<string>(init.date ?? "");
  const [time, setTime] = useState<string>(init.time ?? "");
  const [status, setStatus] = useState<string>(init.status ?? "Tentative");
  const [pilotId, setPilotId] = useState<string>(init.pilot_id ?? "");
  const [p1Id, setP1Id] = useState<string>(init.passenger1_id ?? "");
  const [p2Id, setP2Id] = useState<string>(init.passenger2_id ?? "");
  const [ecId, setEcId] = useState<string>(init.emergency_contact_id ?? "");
  const [pickupId, setPickupId] = useState<string>(init.pickup_location_id ?? "");
  const [notes, setNotes] = useState<string>(init.pre_ride_notes ?? "");

  const [pickers, setPickers] = useState<PickersPayload>({ pilots: [], passengers: [], emergencyContacts: [] });
  const [pickups, setPickups] = useState<PickupOption[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [a, b] = await Promise.all([
          fetch("/api/pickers/list", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/pickups/list", { cache: "no-store" }).then((r) => r.json()),
        ]);
        if (!alive) return;
        setPickers(a);
        setPickups(b?.pickups ?? []);
      } catch (e: any) {
        setErr(e?.message ?? "Failed loading options");
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  // If only one option is available for a dropdown, select it by default.
  useEffect(() => { if (!pilotId && pickers.pilots.length === 1) setPilotId(pickers.pilots[0].id); }, [pickers.pilots, pilotId]);
  useEffect(() => { if (!ecId && pickers.emergencyContacts.length === 1) setEcId(pickers.emergencyContacts[0].id); }, [pickers.emergencyContacts, ecId]);
  useEffect(() => { if (!p1Id && pickers.passengers.length === 1) setP1Id(pickers.passengers[0].id); }, [pickers.passengers, p1Id]);
  useEffect(() => { if (!pickupId && pickups.length === 1) setPickupId(pickups[0].id); }, [pickups, pickupId]);

  const selectedIds = [pilotId, p1Id, p2Id, ecId].filter(Boolean) as string[];
  const filter = (list: PersonOption[], keep?: string) =>
    list.filter((o) => o.id === keep || !selectedIds.includes(o.id));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      date,
      ride_time: time,
      status,
      pickup_location_id: pickupId,
      emergency_contact_id: ecId,
      pilot_id: pilotId,
      passenger1_id: p1Id,
      passenger2_id: p2Id || null,
      pre_ride_notes: notes || null,
    };
    setSaving(true);
    try {
      if (props.rideId) {
        const resp = await fetch(`/api/rides/${props.rideId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const j = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(j?.error || "Failed to update");
        props.onSaved?.(props.rideId);
      } else {
        const resp = await fetch("/api/rides/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const j = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(j?.error || "Failed to save");
        props.onSaved?.(j?.id);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function onCancelClick() {
    if (props.onCancel) props.onCancel();
    else router.back();
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
          <select className="border rounded px-3 py-2" value={time} onChange={(e) => setTime(e.target.value)} required>
            <option value="">Select time…</option>
            {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Status</span>
          <select className="border rounded px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
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
          <select
            className={"border rounded px-3 py-2 " + (!p1Id ? "bg-gray-100 opacity-60 cursor-not-allowed" : "")}
            value={p2Id}
            onChange={(e) => setP2Id(e.target.value)}
            disabled={!p1Id}
          >
            <option value="">—</option>
            {filter(pickers.passengers, p2Id).map((p) => (<option key={p.id} value={p.id}>{p.display_name}</option>))}
          </select>
          {!p1Id && <span className="text-xs text-gray-500 mt-1">Choose Passenger 1 first</span>}
        </label>

        <label className="flex flex-col gap-1 md:col-span-3">
          <span className="text-sm font-medium">Pre-ride notes</span>
          <textarea className="border rounded px-3 py-2 min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>

      <div className="flex items-center gap-3 justify-end">
        <button type="button" className="px-4 py-2 rounded border" onClick={onCancelClick}>Cancel</button>
        <button type="submit" className="px-4 py-2 rounded bg-black text-white disabled:opacity-50" disabled={saving}>Save</button>
      </div>
    </form>
  );
}
