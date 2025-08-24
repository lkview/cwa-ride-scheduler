import { NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "Missing ?date=YYYY-MM-DD" }, { status: 400 });
  }

  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("ride_events")
    .select("meeting_time")
    .eq("date", date);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const times = (data || []).map((r: any) => r.meeting_time);
  return NextResponse.json({ times });
}
