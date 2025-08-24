import { NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabaseServer";

export async function POST(req: Request) {
  const supabase = await getServerSupabase();
  const body = await req.json().catch(() => ({}));
  const { id, name, address, notes } = body || {};

  if (!id || !name || !address) {
    return NextResponse.json({ error: "Missing id, name, or address" }, { status: 400 });
  }

  const { error } = await supabase
    .from("pickup_locations")
    .update({ name, address, notes })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
