"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; label: string };
type Person = { id: string; first_name?: string | null; last_name?: string | null };
type Pickup = { id: string; name?: string | null };

type RideFormProps = {
  /** If present, we will PATCH /api/rides/:rideId; otherwise POST /api/rides/create */
  rideId?: string;
  /** Initial values. Accepts either meeting_time or ride_time. */
  initial?: Partial<{
    date: string;
    meeting_time: string | null;
    ride_time: string | null;
    status: string | null;
    pickup_location_id: string | null;
    emergency_contact_id: string | null;
    pilot_id: string | null;
    passenger1_id: string | null;
    passenger2_id: string | null;
    pre_ride_notes: string | null;
  }>;
};

/** Build half-hour slots 07:00–20:00 as HH:MM:SS strings with human labels */
function buildTimeOptions() {
  const out: { value: string; label: string }[] = [];
  const start = 7 * 60;
  const end = 20 * 60; // inclusive 8:00 PM
  for (let m = start; m <= end; m += 30) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const value = String(h).padStart(2, "0") + ":" + String(mm).padStart(2, "0") + ":00";
    const dt = new Date();
    dt.setHours(h, mm, 0, 0);
    const label = dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    out.push({ value, label });
  }
  return out;
}
const TIME_OPTIONS = buildTimeOptions();

function normalizeHMS(input?: string | null): string {
  if (!input) return "";
  // Already HH:MM:SS
  if (/^\d{2}:\d{2}:\d{2}$/.test(input)) return input;
  // "H:MM" or "HH:MM"
  if (/^\d{1,2}:\d{2}$/.test(input)) return input.padStart(5, "0") + ":00";
  // "H:MM AM/PM"
  const ampm = input.trim().toUpperCase();
  const m = ampm.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (m) {
    let h = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const isPM = m[3] === "PM";
    if (h === 12) h = isPM ? 12 : 0;
    else if (isPM) h += 12;
    return String(h).padStart(2, "0") + ":" + String(mm).padStart(2, "0") + ":00";
  }
  return input; // fallback
}

function fullName(p?: Person | null): string {
  if (!p) return "";
  return [p.first_name || "", p.last_name || ""].map(s => s?.trim()).filter(Boolean).join(" ").trim();
}

const STATUS_OPTIONS = [
  { value: "tentative", label: "Tentative" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "canceled",  label: "Canceled"  },
];

export default function RideForm({ rideId, initial }: RideFormProps) {
  const router = useRouter();

  // Load people & pickups for dropdowns
  const [people, setPeople] = useState<Person[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Controlled form state
  const [date, setDate] = useState(initial?.date || "");
  const [rideTime, setRideTime] = useState(() => normalizeHMS(initial?.meeting_time ?? initial?.ride_time ?? ""));
  const [status, setStatus] = useState((initial?.status || "tentative")?.toString().toLowerCase());
  const [pickupId, setPickupId] = useState(initial?.pickup_location_id || "");
  const [pilotId, setPilotId] = useState(initial?.pilot_id || "");
  const [ecId, setEcId] = useState(initial?.emergency_contact_id || "");
  const [p1Id, setP1Id] = useState(initial?.passenger1_id || "");
  const [p2Id, setP2Id] = useState(initial?.passenger2_id || "");
  const [notes, setNotes] = useState(initial?.pre_ride_notes || "");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [peopleRes, pickupRes] = await Promise.all([
          fetch("/api/people/list", { cache: "no-store" }),
          fetch("/api/pickups/list", { cache: "no-store" }),
        ]);
        const p = await peopleRes.json();
        const k = await pickupRes.json();
        if (!alive) return;
        if (!peopleRes.ok) throw new Error(p?.error || "Failed loading people");
        if (!pickupRes.ok) throw new Error(k?.error || "Failed loading pickup locations");
        setPeople(p.people || []);
        setPickups(k.pickups || []);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Failed loading lists");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const canSave =
    !!date && !!rideTime && !!pickupId && !!ecId && !!pilotId && !!p1Id && !saving;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        date,
        ride_time: rideTime,
        status,
        pickup_location_id: pickupId,
        emergency_contact_id: ecId,
        pilot_id: pilotId,
        passenger1_id: p1Id,
        passenger2_id: p2Id || null,
        pre_ride_notes: notes || null,
      };
      const url = rideId ? `/api/rides/${rideId}` : "/api/rides/create";
      const method = rideId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Failed to save ride");
      // Navigate back to Home after successful save
      router.push("/");
      router.refresh?.();
    } catch (e: any) {
      setErr(e?.message || "Failed to save ride");
    } finally {
      setSaving(false);
    }
  }

  function onCancel() {
    router.push("/");
  }

  // Build dropdown options
  const peopleOpts: Option[] = useMemo(
    () => people.map(p => ({ id: p.id, label: fullName(p) || p.id.slice(0, 8) })),
    [people]
  );
  const pickupOpts: Option[] = useMemo(
    () => pickups.map(pl => ({ id: pl.id, label: pl.name || pl.id.slice(0, 8) })),
    [pickups]
  );

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {err && (
        <div className="p-3 border rounded bg-red-50 text-red-700">{err}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input type="date" className="w-full border rounded px-3 py-2"
            value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Meeting time</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={rideTime}
            onChange={e => setRideTime(e.target.value)}
          >
            <option value="">Select time…</option>
            {TIME_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Pickup location</label>
          <select className="w-full border rounded px-3 py-2"
            value={pickupId} onChange={e => setPickupId(e.target.value)}>
            <option value="">—</option>
            {pickupOpts.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Pilot</label>
          <select className="w-full border rounded px-3 py-2"
            value={pilotId} onChange={e => setPilotId(e.target.value)}>
            <option value="">—</option>
            {peopleOpts.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Emergency contact</label>
          <select className="w-full border rounded px-3 py-2"
            value={ecId} onChange={e => setEcId(e.target.value)}>
            <option value="">—</option>
            {peopleOpts.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Passenger 1</label>
          <select className="w-full border rounded px-3 py-2"
            value={p1Id} onChange={e => setP1Id(e.target.value)}>
            <option value="">—</option>
            {peopleOpts.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Passenger 2 (optional)</label>
          <select className="w-full border rounded px-3 py-2"
            value={p2Id} onChange={e => setP2Id(e.target.value)} disabled={!p1Id}>
            <option value="">—</option>
            {peopleOpts.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          {!p1Id && <div className="text-xs text-gray-500 mt-1">Select Passenger 1 first.</div>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Pre-ride notes</label>
          <textarea className="w-full border rounded px-3 py-2 min-h-[120px]"
            value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="px-4 py-2 rounded border" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 rounded bg-black text-white disabled:opacity-50" disabled={!canSave}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
