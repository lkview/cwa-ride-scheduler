"use client";

import React, { useEffect, useState } from "react";
import Calendar3Week from "@/components/Calendar3Week";

type RideRow = {
  id: string;
  date: string;
  meeting_time: string;
  status: string;
  pickup_name: string | null;
  pilot_name: string | null;
  passenger1_name: string | null;
  passenger2_name: string | null;
};

function fmtWhen(dateISO: string, hms: string) {
  const [y,m,d] = dateISO.split("-").map(Number);
  const [hh,mm] = hms.split(":").map(Number);
  const dt = new Date(y, m-1, d, hh, mm);
  const date = dt.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  const time = dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${date}, ${time}`;
}

export default function RidesPage() {
  const [rides, setRides] = useState<RideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/rides/list", { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed to load rides");
      setRides(j.rides ?? []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load rides");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/rides/${pendingDeleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed to delete");
      setPendingDeleteId(null);
      await load();
    } catch (e: any) {
      alert(e?.message || "Failed to delete ride");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Rides</h1>

      {/* NEW: Calendar at the top */}
      <Calendar3Week />

      {/* controls */}
      <div className="flex items-center justify-between">
        <a className="px-4 py-2 rounded bg-black text-white" href="/ride-events/new">New ride</a>
        <button className="px-3 py-1 rounded border" onClick={load}>Refresh</button>
      </div>

      {/* List */}
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded">
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
            ) : err ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-red-600">{err}</td></tr>
            ) : rides.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-500">No rides yet.</td></tr>
            ) : (
              rides.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 whitespace-nowrap">{fmtWhen(r.date, r.meeting_time)}</td>
                  <td className="px-3 py-2">{r.pilot_name ?? "—"}</td>
                  <td className="px-3 py-2">
                    {[r.passenger1_name, r.passenger2_name].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-3 py-2">{r.pickup_name ?? "—"}</td>
                  <td className="px-3 py-2 capitalize">{r.status}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <a className="px-2 py-1 rounded border" href={`/ride-events/edit/${r.id}`}>Edit</a>
                      <button className="px-2 py-1 rounded border border-red-400 text-red-700" onClick={() => setPendingDeleteId(r.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* friendly confirm */}
      {pendingDeleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[520px] shadow-xl">
            <div className="p-4 border-b text-lg font-semibold">Delete this ride?</div>
            <div className="p-4 text-sm text-gray-700">
              This will remove the ride from the schedule. You can always create it again later.
            </div>
            <div className="p-4 flex justify-end gap-3">
              <button className="px-4 py-2 rounded border" onClick={() => setPendingDeleteId(null)} disabled={deleting}>Cancel</button>
              <button className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
