// app/api/pickups/list/route.ts
import { NextResponse } from "next/server";
import { getAdminClient } from "@/app/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("pickup_locations").select("id, name, address").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pickups: data ?? [] });
}
