import { NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("pickup_locations")
    .select("id, name, address, notes, lat, lng, created_at, updated_at")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ pickups: data || [] });
}
