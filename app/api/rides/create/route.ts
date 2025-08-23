import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getAccessTokenFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("sb-access-token")?.value || cookieStore.get("supabase-auth-token")?.value;
}

async function getSupabaseClientStrict(tokenFromHeader?: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const token = tokenFromHeader || (await getAccessTokenFromCookie());
  if (!token) return null;
  return createClient(url, anon, {
    auth: { persistSession: false, detectSessionInUrl: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

function uiToDbStatus(ui: string) {
  const s = (ui || '').toLowerCase();
  if (s === 'scheduled') return 'Tentative';
  if (s === 'cancelled') return 'Canceled';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const supabase = await getSupabaseClientStrict(tokenFromHeader);
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const ride_date: string | null = body?.ride_date ?? null;
  const ride_time: string | null = body?.ride_time ?? null;
  const notes: string | null = body?.notes ?? null;
  const pilot_id: string | null = body?.pilot_id ?? null;
  const passenger1_id: string | null = body?.passenger1_id ?? null;
  const passenger2_id: string | null = body?.passenger2_id ?? null;
  const emergency_contact_id: string | null = body?.emergency_contact_id ?? null;
  const pickup_location_id: string | null = body?.pickup_location_id ?? null;
  const status: string | null = body?.status ?? null;

  if (!ride_date || !ride_time || !pilot_id || !passenger1_id || !emergency_contact_id || !status || !pickup_location_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // 1) Try exact function for the provided schema
  const rExact = await supabase.rpc("rides_create_exact", {
    p_date: ride_date, p_meeting_time: ride_time, p_pickup_location_id: pickup_location_id,
    p_pilot_id: pilot_id, p_passenger1_id: passenger1_id, p_passenger2_id: passenger2_id,
    p_emergency_contact_id: emergency_contact_id, p_status: uiToDbStatus(status), p_notes: notes
  });

  let data = rExact.data, error = rExact.error;

  // 2) Fallbacks if exact isn't there
  if (error) {
    const ride_ts_iso = new Date(`${ride_date}T${ride_time}:00`).toISOString();
    const r2 = await supabase.rpc("rides_create_universal", {
      p_ride_ts: ride_ts_iso, p_pilot_id: pilot_id, p_passenger1_id: passenger1_id,
      p_passenger2_id: passenger2_id, p_emergency_contact_id: emergency_contact_id,
      p_status: uiToDbStatus(status), p_title: null, p_notes: notes
    });
    if (!r2.error) { data = r2.data; error = null; }
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data });
}
