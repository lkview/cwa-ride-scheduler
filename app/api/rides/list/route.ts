import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * List rides using the SQL view `ride_event_summary_v` to avoid
 * PostgREST embed ambiguity (there are multiple FKs to `people`).
 */
export async function GET() {
  const { data, error } = await supabase
    .from("ride_event_summary_v")
    .select("*")
    .order("date", { ascending: false })
    .order("meeting_time", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ rides: data ?? [] });
}
