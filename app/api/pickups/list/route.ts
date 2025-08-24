import { NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;


const noStore = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
} as const;


export async function GET() {
  try {
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .schema("public")
      .from("pickup_locations")
      .select("*")
      .order("name");

    if (error) {
      return NextResponse.json(
        { pickups: [], schemaUsed: "public", error: error.message },
        { headers: noStore }
      );
    }
    return NextResponse.json(
      { pickups: data ?? [], schemaUsed: "public" },
      { headers: noStore }
    );
  } catch (e: any) {
    return NextResponse.json(
      { pickups: [], schemaUsed: "public", error: e?.message || "failed" },
      { headers: noStore }
    );
  }
}
