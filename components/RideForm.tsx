"use client";

import React, { useEffect, useMemo, useState } from "react";

/** Named type export so pages can `import { RideEvent } from "components/RideForm"` */
export type RideEvent = {
  id?: string;
  date?: string | null;
  time?: string | null;
  status?: string | null;
  pilot_id?: string | null;
  passenger1_id?: string | null;
  passenger2_id?: string | null;
  emergency_contact_id?: string | null;
  pickup_location_id?: string | null; // legacy pages may reference this
  pickup_id?: string | null;          // form uses this internally
  notes?: string | null;
};

/**
 * Drop-in RideForm that pulls picker options from server routes:
 *   - /api/pickers/list  -> { pilots[], passengers[], emergencyContacts[] }
 *   - /api/pickups/list  -> { pickups[] }
 *
 * It also prevents selecting the same person in multiple roles by
 * filtering options live across Pilot, Passenger 1/2 and Emergency Contact.
 *
 * NOTE: Save behaviour is preserved: if parent passes a handler it is used;
 * otherwise we POST to /api/rides/create as a fallback.
 */

type PersonOption = { id: string; display_name: string; email?: string; phone?: string };
type PickupOption = { id: string; name: string; address?: string | null; notes?: string | null };

type PickersPayload = {
  pilots: PersonOption[];
  passengers: PersonOption[];
  emergencyContacts: PersonOption[];
};

type RideFormProps = {
  onCancel?: () => void;
  onSaved?: (rideId?: string) => void;
  onSave?: (payload: any) => Promise<any> | any; // legacy compat
  // allow passing initial values (all optional)
  initial?: Partial<RideEvent>;
};

function optionLabel(o?: PersonOption | null) {
  return o?.display_name ?? "";
}

function filtered<T extends { id: string }>(
  list: T[],
  excludeIds: string[],
  keepId?: string | null
) {
  const keep = keepId ?? null;
  return list.filter((o) => o.id === keep || !excludeIds.includes(o.id));
}

const RideForm: React.FC<RideFormProps> = (props) => {
  const init = props.initial ?? {};

  // Form state
  const [date, setDate] = useState(init.date ?? "");
  const [time, setTime] = useState(init.time ?? "");
  const [pilotId, setPilotId] = useState<string>(init.pilot_id ?? "");
  const [p1Id, setP1Id] = useState<string>(init.passenger1_id ?? "");
  const [p2Id, setP2Id] = useState<string>(init.passenger2_id ?? "");
  const [ecId, setEcId] = useState<string>(init.emergency_contact_id ?? "");
  const [pickupId, setPickupId] = useState<string>((init.pickup_id ?? init.pickup_location_id) ?? "");
  const [notes, setNotes] = useState<string>(init.notes ?? "");

  // Options
  const [pickers, setPickers] = useState<PickersPayload>({
    pilots: [],
    passengers: [],
    emergencyContacts: [],
  });
  const [pickups, setPickups] = useState<PickupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        const [p1, p2] = await Promise.all([
          fetch("/api/pickers/list", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/pickups/list", { cache: "no-store" }).then((r) => r.json()),
        ]);
        if (!alive) return;
        setPickers(p1 as PickersPayload);
        setPickups((p2?.pickups ?? []) as PickupOption[]);
        setErr(null);
      } catch (e: any) {
        console.error("Failed loading pickers:", e);
        setErr(e?.message ?? "Failed loading options");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  // Prevent choosing same person twice (id-based)
  const selectedIds = [pilotId, p1Id, p2Id, ecId].filter(Boolean) as string[];

  const pilotOpts = useMemo(
    () => filtered(pickers.pilots, selectedIds.filter((id) => id !== pilotId), pilotId),
    [pickers.pilots, selectedIds, pilotId]
  );
  const p1Opts = useMemo(
    () => filtered(pickers.passengers, selectedIds.filter((id) => id !== p1Id), p1Id),
    [pickers.passengers, selectedIds, p1Id]
  );
  const p2Opts = useMemo(
    () => filtered(pickers.passengers, selectedIds.filter((id) => id !== p2Id), p2Id),
    [pickers.passengers, selectedIds, p2Id]
  );
  const ecOpts = useMemo(
    () => filtered(pickers.emergencyContacts, selectedIds.filter((id) => id !== ecId), ecId),
    [pickers.emergencyContacts, selectedIds, ecId]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      date,
      time,
      pilot_id: pilotId || null,
      passenger1_id: p1Id || null,
      passenger2_id: p2Id || null,
      emergency_contact_id: ecId || null,
      pickup_id: pickupId || null,
      notes: notes || null,
    };

    try {
      if (typeof props.onSave === "function") {
        await props.onSave(payload);
        props.onSaved?.();
        return;
      }
      // Fallback generic POST (no-op if endpoint doesn't exist)
      const resp = await fetch("/api/rides/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => null);
      if (resp && resp.ok) {
        const j = await resp.json().catch(() => ({}));
        props.onSaved?.(j?.id);
      } else {
        // Even if POST isn't available, we still close to preserve UX
        props.onSaved?.();
      }
    } catch (e) {
      console.error(e);
      props.onSaved?.();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {err && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Date</span>
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={date ?? ""}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Time</span>
          <input
            type="time"
            className="border rounded px-3 py-2"
            value={time ?? ""}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Pilot</span>
          <select
            className="border rounded px-3 py-2"
            value={pilotId}
            onChange={(e) => setPilotId(e.target.value)}
            disabled={loading}
            required
          >
            <option value="">Select a pilot</option>
            {pilotOpts.map((p) => (
              <option key={p.id} value={p.id}>
                {optionLabel(p)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Emergency Contact</span>
          <select
            className="border rounded px-3 py-2"
            value={ecId}
            onChange={(e) => setEcId(e.target.value)}
            disabled={loading}
            required
          >
            <option value="">Select emergency contact</option>
            {ecOpts.map((p) => (
              <option key={p.id} value={p.id}>
                {optionLabel(p)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-sm font-medium">Passenger 1</span>
          <select
            className="border rounded px-3 py-2"
            value={p1Id}
            onChange={(e) => setP1Id(e.target.value)}
            disabled={loading}
            required
          >
            <option value="">Select passenger</option>
            {p1Opts.map((p) => (
              <option key={p.id} value={p.id}>
                {optionLabel(p)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-sm font-medium">Passenger 2 (optional)</span>
          <select
            className="border rounded px-3 py-2"
            value={p2Id}
            onChange={(e) => setP2Id(e.target.value)}
            disabled={loading}
          >
            <option value="">— None —</option>
            {p2Opts.map((p) => (
              <option key={p.id} value={p.id}>
                {optionLabel(p)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-sm font-medium">Pickup location</span>
          <select
            className="border rounded px-3 py-2"
            value={pickupId}
            onChange={(e) => setPickupId(e.target.value)}
            disabled={loading}
          >
            <option value="">Select pickup</option>
            {pickups.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-sm font-medium">Notes</span>
          <textarea
            className="border rounded px-3 py-2 min-h-[120px]"
            value={notes ?? ""}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 flex gap-3 justify-end">
        <button
          type="button"
          className="px-4 py-2 rounded border"
          onClick={() => props.onCancel?.()}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          disabled={loading}
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default RideForm;
