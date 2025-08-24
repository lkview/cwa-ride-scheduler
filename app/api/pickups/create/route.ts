import { NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const supabase = await getServerSupabase();
  const body = await req.json().catch(() => ({}));
  const { name, address, notes } = body || {};

  if (!name || !address) {
    return NextResponse.json({ error: "Missing name or address" }, { status: 400 });
  }

  const { data, error } = await supabase
    .schema("public")
    .from("pickup_locations")
    .insert([{ name, address, notes }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, pickup: data });
}
