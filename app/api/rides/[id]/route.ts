import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabaseClient";

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const { id } = ctx.params || {};
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ride_events")
    .select(
      "id,date,meeting_time,status,pickup_location_id,emergency_contact_id,pilot_id,passenger1_id,passenger2_id,pre_ride_notes"
    )
    .eq("id", id)
    .single();

  if (error) {
    const notFound = String(error.message || "").toLowerCase().includes("row not found");
    if (notFound) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ride: data }, { status: 200 });
}
