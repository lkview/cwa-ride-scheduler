// app/api/pickers/list/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ensure no caching in Edge/CDN
export const dynamic = "force-dynamic";

type PickerRow = { id: string; display_name: string };

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE;

  if (!url || !serviceRole) {
    return NextResponse.json(
      { error: "Missing SUPABASE env vars" },
      { status: 500 }
    );
  }

  const supabase = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetch as any },
  });

  const [pilotsRes, ecsRes, passengersRes] = await Promise.all([
    supabase.from("picker_pilots_v").select("id, display_name").order("display_name"),
    supabase.from("picker_emergency_contacts_v").select("id, display_name").order("display_name"),
    supabase.from("picker_passengers_v").select("id, display_name").order("display_name"),
  ]);

  const mapRows = (res: any): PickerRow[] => {
    if (res.error) {
      // Surface the first error to help debugging
      throw res.error;
    }
    return (res.data ?? []).map((r: any) => ({
      id: r.id,
      display_name: r.display_name,
    }));
  };

  try {
    const payload = {
      pilots: mapRows(pilotsRes),
      emergencyContacts: mapRows(ecsRes),
      passengers: mapRows(passengersRes),
    };
    return NextResponse.json(payload);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
