"use client";

import React from "react";
import { useFilteredPickers } from "../hooks/usePickers";

type Props = {
  pilotId?: string | null;
  setPilotId: (v: string | null) => void;
  ecId?: string | null;
  setEcId: (v: string | null) => void;
  p1Id?: string | null;
  setP1Id: (v: string | null) => void;
  p2Id?: string | null;
  setP2Id: (v: string | null) => void;
  pickupId?: string | null;
  setPickupId: (v: string | null) => void;
};

export default function RideSelectors(props: Props) {
  const { loading, error, pilots, emergencyContacts, passengers, pickups } = useFilteredPickers({
    pilotId: props.pilotId,
    p1Id: props.p1Id,
    p2Id: props.p2Id,
    ecId: props.ecId,
  });

  if (error) {
    return <div className="text-red-600 text-sm">Failed to load options: {error}</div>;
  }
  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading options…</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <label className="space-y-1">
        <div className="text-sm font-medium">Pilot</div>
        <select
          className="w-full rounded border p-2"
          value={props.pilotId ?? ""}
          onChange={(e) => props.setPilotId(e.target.value || null)}
        >
          <option value="">Select a pilot</option>
          {pilots.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1">
        <div className="text-sm font-medium">Emergency Contact</div>
        <select
          className="w-full rounded border p-2"
          value={props.ecId ?? ""}
          onChange={(e) => props.setEcId(e.target.value || null)}
        >
          <option value="">Select emergency contact</option>
          {emergencyContacts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1">
        <div className="text-sm font-medium">Passenger 1</div>
        <select
          className="w-full rounded border p-2"
          value={props.p1Id ?? ""}
          onChange={(e) => props.setP1Id(e.target.value || null)}
        >
          <option value="">Select passenger</option>
          {passengers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1">
        <div className="text-sm font-medium">Passenger 2 (optional)</div>
        <select
          className="w-full rounded border p-2"
          value={props.p2Id ?? ""}
          onChange={(e) => props.setP2Id(e.target.value || null)}
        >
          <option value="">— None —</option>
          {passengers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 md:col-span-2">
        <div className="text-sm font-medium">Pickup location</div>
        <select
          className="w-full rounded border p-2"
          value={props.pickupId ?? ""}
          onChange={(e) => props.setPickupId(e.target.value || null)}
        >
          <option value="">Select pickup</option>
          {pickups.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}