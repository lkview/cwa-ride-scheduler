"use client";

import React, { useEffect, useMemo, useState } from "react";

type Ride = {
  id: string;
  date: string;                // YYYY-MM-DD
  meeting_time: string;        // HH:MM:SS
  status: string;
  pickup_name?: string | null;
  pilot_name?: string | null;
  passenger1_name?: string | null;
  passenger2_name?: string | null;
  emergency_contact_name?: string | null;
  pre_ride_notes?: string | null;
};

type Day = { y: number; m: number; d: number };

const STATUS_COLORS: Record<string, string> = {
  tentative: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-green-100 text-green-800 border-green-300",
  completed: "bg-gray-200 text-gray-700 border-gray-300",
  canceled:  "bg-red-100 text-red-700 border-red-300",
};

function toKey(day: Day) {
  const mm = String(day.m + 1).padStart(2, "0");
  const dd = String(day.d).padStart(2, "0");
  return `${day.y}-${mm}-${dd}`;
}
function addDays(day: Day, n: number): Day {
  const dt = new Date(day.y, day.m, day.d);
  dt.setDate(dt.getDate() + n);
  return { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() };
}
function today(): Day {
  const dt = new Date();
  return { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() };
}
function timeLabel(hms: string): string {
  const [h, m] = hms.split(":").map((x) => parseInt(x, 10));
  const dt = new Date();
  dt.setHours(h, m, 0, 0);
  return dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function Calendar3Week() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/rides/list", { cache: "no-store" });
        const j = await res.json();
        if (!alive) return;
        if (res.ok) setRides(j.rides ?? []);
        else setErr(j?.error || "Failed to load rides");
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Failed to load rides");
      }
    })();
    return () => { alive = false; };
  }, []);

  const start = today();
  const days: Day[] = useMemo(() => Array.from({ length: 21 }, (_, i) => addDays(start, i)), [start.y, start.m, start.d]);

  const grouped = useMemo(() => {
    const map = new Map<string, Ride[]>();
    for (const r of rides ?? []) {
      const key = r.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.meeting_time || "").localeCompare(b.meeting_time || ""));
    }
    return map;
  }, [rides]);

  return (
    <div className="border rounded-lg p-3 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg">Next 3 weeks</h3>
        <div className="text-xs text-gray-500">Hover a time to see details</div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs font-medium text-gray-600 mb-1">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="px-2 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = toKey(day);
          const dayRides = grouped.get(key) || [];
          const isToday = key === toKey(today());
          return (
            <div key={key} className={`relative min-h-[92px] border rounded p-2 bg-gray-50 ${isToday ? "ring-2 ring-blue-400" : ""}`}>
              <div className="text-xs text-gray-700 mb-1">
                <span className="font-medium">
                  {new Date(day.y, day.m, day.d).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="space-y-1">
                {dayRides.map((r) => {
                  const color = STATUS_COLORS[r.status?.toLowerCase?.() || ""] || "bg-gray-100 text-gray-700 border-gray-300";
                  return (
                    <div key={r.id} className="relative">
                      <button
                        className={`text-[11px] px-2 py-0.5 border rounded ${color}`}
                        onMouseEnter={() => setHoverId(r.id)}
                        onMouseLeave={() => setHoverId((prev) => (prev === r.id ? null : prev))}
                        onFocus={() => setHoverId(r.id)}
                        onBlur={() => setHoverId((prev) => (prev === r.id ? null : prev))}
                      >
                        {timeLabel(r.meeting_time)}
                      </button>
                      {hoverId === r.id && (
                        <div className="absolute z-20 mt-1 w-64 p-3 text-sm bg-white border rounded shadow-xl" role="dialog" aria-label="Ride details">
                          <div className="font-medium mb-1">
                            {timeLabel(r.meeting_time)} &middot; {r.status?.[0]?.toUpperCase() + r.status?.slice(1)}
                          </div>
                          <div className="text-gray-700 space-y-1">
                            {r.pilot_name && <div><span className="font-medium">Pilot:</span> {r.pilot_name}</div>}
                            <div><span className="font-medium">Passengers:</span> {[r.passenger1_name, r.passenger2_name].filter(Boolean).join(", ") || "—"}</div>
                            {r.pickup_name && <div><span className="font-medium">Pickup:</span> {r.pickup_name}</div>}
                            {r.emergency_contact_name && <div><span className="font-medium">Emergency:</span> {r.emergency_contact_name}</div>}
                            {r.pre_ride_notes && (
                              <div className="mt-1">
                                <div className="font-medium">Notes</div>
                                <div className="text-gray-600 whitespace-pre-wrap break-words max-h-32 overflow-auto">{r.pre_ride_notes}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {dayRides.length === 0 && <div className="text-[11px] text-gray-400">—</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 mt-3 text-xs">
        {Object.entries(STATUS_COLORS).map(([k, cls]) => (
          <div key={k} className="flex items-center gap-1">
            <span className={`inline-block w-3 h-3 border rounded ${cls.replace("px-2 py-0.5","")}`}></span>
            <span className="capitalize">{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
