import { NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabaseServer";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const supabase = await getServerSupabase();

  const updates: any = {};
  for (const k of ["name", "address", "notes", "lat", "lng"]) {
    if (k in body) updates[k] = body[k];
  }

  const { data, error } = await supabase
    .from("pickup_locations")
    .update(updates)
    .eq("id", body.id)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ id: data.id, ok: true });
}
