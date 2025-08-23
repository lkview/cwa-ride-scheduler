import { NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabaseServer";

export async function GET() {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.rpc("can_schedule_rides");
  if (error) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  if (data === true) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 403 });
}
