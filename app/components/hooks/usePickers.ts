"use client";

import { useEffect, useMemo, useState } from "react";

export type PersonOpt = { id: string; display_name: string };
export type PickupOpt = { id: string; name: string; address?: string | null; notes?: string | null };

export type PickersResponse = {
  pilots: PersonOpt[];
  emergencyContacts: PersonOpt[];
  passengers: PersonOpt[];
  pickups: PickupOpt[];
};

export function usePickers() {
  const [data, setData] = useState<PickersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch("/api/pickers/list", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as PickersResponse;
        if (alive) setData(json);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Failed to load pickers");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { data, loading, error: err };
}

export function useFilteredPickers(
  selected: { pilotId?: string | null; p1Id?: string | null; p2Id?: string | null; ecId?: string | null }
) {
  const { data, loading, error } = usePickers();

  const filtered = useMemo(() => {
    const ids = new Set<string>(
      [selected.pilotId, selected.p1Id, selected.p2Id, selected.ecId].filter(Boolean) as string[]
    );
    if (!data) {
      return {
        pilots: [] as PersonOpt[],
        passengers: [] as PersonOpt[],
        emergencyContacts: [] as PersonOpt[],
        pickups: [] as PickupOpt[],
      };
    }
    const not = (id: string) => !ids.has(id);
    return {
      pilots: data.pilots.filter((p) => not(p.id)),
      emergencyContacts: data.emergencyContacts.filter((p) => not(p.id)),
      passengers: data.passengers.filter((p) => not(p.id)),
      pickups: data.pickups,
    };
  }, [data, selected.pilotId, selected.p1Id, selected.p2Id, selected.ecId]);

  return { loading, error, ...filtered };
}