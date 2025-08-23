import { NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await getServerSupabase();
  const schemaUsed = process.env.NEXT_PUBLIC_DB_SCHEMA || (process.env.VERCEL_ENV === "production" ? "public" : "dev");

  const { data, error } = await supabase
    .from("pickup_locations")
    .select("id, name, address, notes, lat, lng, created_at, updated_at")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ pickups: [], schemaUsed, error: error.message }, { status: 200 });
  }

  return NextResponse.json({ pickups: data || [], schemaUsed });
}
