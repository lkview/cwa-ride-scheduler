// app/page.tsx
"use client";

import React, { useEffect, useState } from "react";

type RideRow = {
  id: string;
  date: string | null;
  meeting_time: string | null;
  status: string | null;
  pickup_name: string | null;
  pilot_name: string | null;
  passenger1_name: string | null;
  passenger2_name: string | null;
};

export default function HomePage() {
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState({ pickups: 0, pilots: 0, passengers: 0, contacts: 0 });
  const [rides, setRides] = useState<RideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function refreshCounts() {
    const [p, k] = await Promise.all([
      fetch("/api/pickers/list", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/pickups/list", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setCounts({
      pickups: (k?.pickups ?? []).length,
      pilots: (p?.pilots ?? []).length,
      passengers: (p?.passengers ?? []).length,
      contacts: (p?.emergencyContacts ?? []).length,
    });
  }

  async function refreshRides() {
    try {
      setLoading(true);
      const j = await fetch("/api/rides/list", { cache: "no-store" }).then((r) => r.json());
      if (j?.error) throw new Error(j.error);
      setRides(j?.rides ?? []);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load rides");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshCounts(); refreshRides(); }, []);

  const fmt = (d?: string | null, t?: string | null) => {
    if (!d) return "";
    try {
      const dt = new Date(`${d}T${(t || "00:00").slice(0,5)}`);
      return dt.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    } catch { return `${d}${t ? " " + t : ""}`; }
  };

  async function onDelete(id: string) {
    if (!confirm("Delete this ride?")) return;
    const resp = await fetch(`/api/rides/${id}`, { method: "DELETE" });
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      alert(j?.error || "Delete failed");
      return;
    }
    refreshRides();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Rides</h1>

      <div className="mb-4 rounded border bg-yellow-50 text-yellow-800 p-3 text-sm">
        <strong>Debug:</strong>{" "}
        pickups: {counts.pickups} · pilots: {counts.pilots} · passengers: {counts.passengers} · contacts: {counts.contacts}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <a className="px-4 py-2 rounded bg-black text-white" href="/ride-events/new">New ride</a>
        <button className="px-3 py-1 rounded border" onClick={refreshRides}>Refresh</button>
      </div>

      {err && <div className="mb-4 rounded bg-red-50 text-red-700 px-3 py-2 text-sm">{err}</div>}

      <div className="overflow-x-auto rounded border">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">When</th>
              <th className="text-left px-3 py-2">Pilot</th>
              <th className="text-left px-3 py-2">Passengers</th>
              <th className="text-left px-3 py-2">Pickup</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center">Loading rides…</td></tr>
            ) : rides.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-500">No rides yet.</td></tr>
            ) : (
              rides.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 whitespace-nowrap">{fmt(r.date, r.meeting_time)}</td>
                  <td className="px-3 py-2">{r.pilot_name || "—"}</td>
                  <td className="px-3 py-2">{[r.passenger1_name, r.passenger2_name].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-3 py-2">{r.pickup_name || "—"}</td>
                  <td className="px-3 py-2">{r.status || "—"}</td>
                  <td className="px-3 py-2">
                    <a className="mr-3 underline" href={`/ride-events/edit/${r.id}`}>Edit</a>
                    <button className="text-red-600 underline" onClick={() => onDelete(r.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
