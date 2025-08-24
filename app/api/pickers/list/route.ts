// app/api/pickers/list/route.ts
import { NextResponse } from "next/server";
import { getAdminClient } from "@/app/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  const supabase = getAdminClient();
  const [pilots, passengers, ec] = await Promise.all([
    supabase.from("picker_pilots_v").select("id, display_name"),
    supabase.from("picker_passengers_v").select("id, display_name"),
    supabase.from("picker_emergency_contacts_v").select("id, display_name"),
  ]);
  const firstErr = pilots.error || passengers.error || ec.error;
  if (firstErr) return NextResponse.json({ error: firstErr.message }, { status: 500 });
  return NextResponse.json({
    pilots: pilots.data ?? [],
    passengers: passengers.data ?? [],
    emergencyContacts: ec.data ?? [],
  });
}
