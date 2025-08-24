// app/api/rides/list/route.ts
import { NextResponse } from "next/server";
import { getAdminClient } from "@/app/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("ride_event_summary_v").select("*").order("date", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rides: data ?? [] });
}
