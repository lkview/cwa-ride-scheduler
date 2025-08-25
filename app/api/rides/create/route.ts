import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type RideCreate = {
  date: string;
  ride_time: string;
  status?: string;
  pickup_location_id: string;
  emergency_contact_id: string;
  pilot_id: string;
  passenger1_id: string;
  passenger2_id?: string | null;
  pre_ride_notes?: string | null;
};

function toLowerStatus(s?: string | null) {
  const v = String(s || "").toLowerCase().trim();
  if (v === "confirmed") return "confirmed";
  if (v === "completed") return "completed";
  if (v === "canceled" || v === "cancelled") return "canceled";
  return "tentative";
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as RideCreate;

  const required: (keyof RideCreate)[] = [
    "date",
    "ride_time",
    "pickup_location_id",
    "emergency_contact_id",
    "pilot_id",
    "passenger1_id",
  ];
  for (const f of required) {
    if (!(body as any)[f]) {
      return NextResponse.json({ error: `Missing ${String(f)}` }, { status: 400 });
    }
  }
  if (body.pilot_id === body.passenger1_id) {
    return NextResponse.json({ error: "Pilot and Passenger 1 must be different people." }, { status: 400 });
  }
  if (
    body.passenger2_id &&
    (body.passenger2_id === body.pilot_id || body.passenger2_id === body.passenger1_id)
  ) {
    return NextResponse.json({ error: "Passenger 2 must be different from Pilot and Passenger 1." }, { status: 400 });
  }

  const insert = {
    date: body.date,
    meeting_time: body.ride_time,
    status: toLowerStatus(body.status),
    pickup_location_id: body.pickup_location_id,
    emergency_contact_id: body.emergency_contact_id,
    pilot_id: body.pilot_id,
    passenger1_id: body.passenger1_id,
    passenger2_id: body.passenger2_id || null,
    pre_ride_notes: body.pre_ride_notes || null,
  };

  const { data, error } = await supabase
    .from("ride_events")
    .insert(insert)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data!.id, ok: true }, { status: 201 });
}
