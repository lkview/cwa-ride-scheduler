import { NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = await getServerSupabase();
  const schemaUsed = process.env.NEXT_PUBLIC_DB_SCHEMA || (process.env.VERCEL_ENV === "production" ? "public" : "dev");

  const { data, error } = await supabase
    .from("pickup_locations")
    .select("id, name, address, notes, lat, lng, created_at, updated_at")
    .order("created_at", { ascending: false });

  const body: any = { pickups: data || [], schemaUsed };
  if (error) body.error = error.message;

  const res = NextResponse.json(body, { status: 200 });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("CDN-Cache-Control", "no-store");
  res.headers.set("Vercel-CDN-Cache-Control", "no-store");
  return res;
}
