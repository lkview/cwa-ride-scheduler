import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabaseClient";

// Use a broadly-typed second argument to satisfy Next.js 15's route handler typing.
export async function GET(_req: Request, context: any) {
  const id = context?.params?.id as string | undefined;
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
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("row") && msg.includes("not") && msg.includes("found")) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ride: data }, { status: 200 });
}
