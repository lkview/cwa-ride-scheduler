import { NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabaseServer";
import { toDbStatus } from "@/app/lib/statusMap";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const required = ["date", "ride_time", "pickup_location_id", "emergency_contact_id", "pilot_id", "passenger1_id"];
  for (const f of required) {
    if (!body[f]) {
      return NextResponse.json({ error: `Missing ${f}` }, { status: 400 });
    }
  }

  if (body.passenger1_id && body.passenger1_id === body.pilot_id) {
    return NextResponse.json({ error: "Pilot and Passenger 1 must be different people." }, { status: 400 });
  }
  if (body.passenger2_id && (body.passenger2_id === body.pilot_id || body.passenger2_id === body.passenger1_id)) {
    return NextResponse.json({ error: "Passenger 2 must be different from Pilot and Passenger 1." }, { status: 400 });
  }

  const supabase = await getServerSupabase();
  const statusDb = toDbStatus(body.status || "Draft");

  const insert = {
    date: body.date,
    meeting_time: body.ride_time,
    pickup_location_id: body.pickup_location_id,
    emergency_contact_id: body.emergency_contact_id,
    pilot_id: body.pilot_id,
    passenger1_id: body.passenger1_id,
    passenger2_id: body.passenger2_id || null,
    pre_ride_notes: body.pre_ride_notes || null,
    post_ride_notes: body.post_ride_notes || null,
    status: statusDb,
  };

  const { data, error } = await supabase
    .from("ride_events")
    .insert(insert)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ id: data.id, ok: true }, { status: 201 });
}
