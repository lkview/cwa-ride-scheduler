"use client";

import React, { useEffect, useState } from "react";
import RideForm from "../components/RideForm";

type Counts = { pickups: number; pilots: number; passengers: number; contacts: number };

export default function HomePage() {
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Counts>({ pickups: 0, pilots: 0, passengers: 0, contacts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function loadCounts() {
      try {
        setLoading(true);
        const [p, k] = await Promise.all([
          fetch("/api/pickers/list", { cache: "no-store" }).then(r => r.json()),
          fetch("/api/pickups/list", { cache: "no-store" }).then(r => r.json()),
        ]);
        if (!alive) return;
        setCounts({
          pickups: (k?.pickups ?? []).length,
          pilots: (p?.pilots ?? []).length,
          passengers: (p?.passengers ?? []).length,
          contacts: (p?.emergencyContacts ?? []).length,
        });
      } catch {}
      finally {
        if (alive) setLoading(false);
      }
    }
    loadCounts();
    return () => { alive = false; }
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Rides</h1>

      <div className="mb-6 rounded border bg-yellow-50 text-yellow-800 p-3 text-sm">
        <strong>Debug:</strong>{" "}
        pickups: {counts.pickups} · pilots: {counts.pilots} · passengers: {counts.passengers} · contacts: {counts.contacts}
      </div>

      <button
        className="px-4 py-2 rounded bg-black text-white"
        onClick={() => setOpen(true)}
      >
        New ride
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded shadow-lg w-[900px] max-w-[95vw] p-6 relative">
            <button
              className="absolute right-3 top-3 text-xl"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-medium mb-4">New ride</h2>
            <RideForm
              onCancel={() => setOpen(false)}
              onSaved={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
