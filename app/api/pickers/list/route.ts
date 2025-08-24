import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/app/lib/supabaseServer";

// Returns the option lists for the Rides form using the SECURITY DEFINER views:
//   - public.picker_pilots_v (id, display_name, email, phone)
//   - public.picker_emergency_contacts_v (id, display_name, email, phone)
//   - public.picker_passengers_v (id, display_name, email, phone)
//   - public.pickup_locations_v (id, name, address, notes)
export async function GET() {
  const supabase = getSupabaseServerClient ? getSupabaseServerClient() : (await import("@/app/lib/supabaseServer")).default();

  async function q(table: string, select: string, orderCol?: string) {
    // @ts-ignore
    const query = supabase.from(table).select(select);
    if (orderCol) query.order(orderCol, { ascending: true });
    const { data, error } = await query;
    if (error) return [];
    return data ?? [];
  }

  const pilots = await q("picker_pilots_v", "id, display_name", "display_name");
  const emergencyContacts = await q("picker_emergency_contacts_v", "id, display_name", "display_name");
  const passengers = await q("picker_passengers_v", "id, display_name", "display_name");
  let pickups = await q("pickup_locations_v", "id, name, address, notes", "name");
  if (!pickups.length) {
    pickups = await q("pickup_locations", "id, name, address, notes", "name");
  }

  return NextResponse.json({ pilots, emergencyContacts, passengers, pickups });
}