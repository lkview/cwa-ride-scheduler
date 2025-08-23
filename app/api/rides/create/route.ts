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

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const supabase = await getSupabaseClientStrict(tokenFromHeader);
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const ride_date: string | null = body?.ride_date ?? null;
  const ride_time: string | null = body?.ride_time ?? null;
  const title: string | null = body?.title ?? null;
  const notes: string | null = body?.notes ?? null;
  const pilot_id: string | null = body?.pilot_id ?? null;
  const passenger1_id: string | null = body?.passenger1_id ?? null;
  const passenger2_id: string | null = body?.passenger2_id ?? null;
  const emergency_contact_id: string | null = body?.emergency_contact_id ?? null;
  const status: string | null = body?.status ?? null;

  if (!ride_date || !ride_time || !pilot_id || !passenger1_id || !emergency_contact_id || !status) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const ride_ts_iso = new Date(`${ride_date}T${ride_time}:00`).toISOString();

  // Try universal create (adapts to your table), then full, then simple
  let { data, error } = await supabase.rpc("rides_create_universal", {
    p_ride_ts: ride_ts_iso, p_pilot_id: pilot_id, p_passenger1_id: passenger1_id,
    p_passenger2_id: passenger2_id, p_emergency_contact_id: emergency_contact_id,
    p_status: status, p_title: title, p_notes: notes
  });

  if (error) {
    const r2 = await supabase.rpc("rides_create_full", {
      p_ride_ts: ride_ts_iso, p_pilot_id: pilot_id, p_passenger1_id: passenger1_id,
      p_passenger2_id: passenger2_id, p_emergency_contact_id: emergency_contact_id,
      p_status: status, p_title: title, p_notes: notes
    });
    if (!r2.error) { data = r2.data; error = null; }
    else {
      const r3 = await supabase.rpc("rides_create_simple", {
        p_ride_date: ride_date, p_title: title, p_notes: notes
      });
      data = r3.data; error = r3.error;
    }
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data });
}
