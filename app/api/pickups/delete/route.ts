import { NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabaseServer";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const id = body.id;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = await getServerSupabase();

  const { data: anyRef, error: refErr } = await supabase
    .from("ride_events")
    .select("id")
    .eq("pickup_location_id", id)
    .limit(1);

  if (refErr) {
    return NextResponse.json({ error: refErr.message }, { status: 400 });
  }

  if (anyRef && anyRef.length > 0) {
    return NextResponse.json(
      { error: "This pickup location is used by one or more rides and cannot be deleted." },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("pickup_locations").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
