// app/api/pickers/list/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Force Node runtime so server env vars are available
export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  // Accept either naming convention to avoid config drift
  const SUPABASE_URL =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE =
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return NextResponse.json(
      { error: "Missing SUPABASE env vars" },
      { status: 500 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    db: { schema: "public" },
    auth: { persistSession: false },
  });

  // Fetch each picker list from the SECURITY DEFINER views
  const [pilotsRes, ecRes, passengersRes] = await Promise.all([
    supabase.from("picker_pilots_v").select("id, display_name").order("display_name"),
    supabase.from("picker_emergency_contacts_v").select("id, display_name").order("display_name"),
    supabase.from("picker_passengers_v").select("id, display_name").order("display_name"),
  ]);

  const firstErr = pilotsRes.error || ecRes.error || passengersRes.error;
  if (firstErr) {
    return NextResponse.json(
      { error: firstErr.message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      pilots: pilotsRes.data ?? [],
      emergencyContacts: ecRes.data ?? [],
      passengers: passengersRes.data ?? [],
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
