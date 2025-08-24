// app/api/pickers/list/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Ensure this runs on Node (not edge), where env secrets are available.
export const runtime = "nodejs";

type PickerRow = {
  id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
};

type PickupRow = {
  id: string;
  name: string;
  address: string | null;
  notes: string | null;
};

function getSupabaseAsService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!; // set in Vercel > Settings > Environment Variables
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  const supabase = getSupabaseAsService();

  const [pilots, ecs, passengers, pickupsV] = await Promise.all([
    supabase
      .from("picker_pilots_v")
      .select<"*", PickerRow>("*")
      .order("display_name", { ascending: true }),
    supabase
      .from("picker_emergency_contacts_v")
      .select<"*", PickerRow>("*")
      .order("display_name", { ascending: true }),
    supabase
      .from("picker_passengers_v")
      .select<"*", PickerRow>("*")
      .order("display_name", { ascending: true }),
    supabase
      .from("pickup_locations_v")
      .select<"id,name,address,notes", PickupRow>("id,name,address,notes")
      .order("name", { ascending: true }),
  ]);

  // Fallback to base table if the _v view isn’t present
  let pickups: PickupRow[] = pickupsV.data ?? [];
  let pickupsErr = pickupsV.error?.message ?? null;

  if (!pickups.length) {
    const table = await supabase
      .from("pickup_locations")
      .select<"id,name,address,notes", PickupRow>("id,name,address,notes")
      .order("name", { ascending: true });
    pickups = table.data ?? [];
    pickupsErr = pickupsErr ?? table.error?.message ?? null;
  }

  return NextResponse.json({
    pilots: pilots.data ?? [],
    emergencyContacts: ecs.data ?? [],
    passengers: passengers.data ?? [],
    pickups,
    meta: {
      pilotsErr: pilots.error?.message ?? null,
      ecErr: ecs.error?.message ?? null,
      passengersErr: passengers.error?.message ?? null,
      pickupsErr,
    },
  });
}
