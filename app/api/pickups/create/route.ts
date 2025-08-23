import { NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabaseServer";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.name || !body.address) {
    return NextResponse.json({ error: "Missing name or address" }, { status: 400 });
  }

  const supabase = await getServerSupabase();

  const can = await supabase.rpc("can_schedule_rides");
  if (!can.error && can.data !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("pickup_locations")
    .insert({
      name: body.name,
      address: body.address,
      notes: body.notes ?? null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ id: data.id, ok: true }, { status: 201 });
}
