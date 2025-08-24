// app/api/rides/create/route.ts
import { NextResponse } from "next/server";
import { getAdminClient } from "@/app/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  const required = ["date","ride_time","pickup_location_id","emergency_contact_id","pilot_id","passenger1_id"];
  for (const k of required) if (!body[k]) return NextResponse.json({ error: `Missing ${k}` }, { status: 400 });

  const supabase = getAdminClient();
  const insert = {
    date: body.date,
    meeting_time: body.ride_time,
    pickup_location_id: body.pickup_location_id,
    emergency_contact_id: body.emergency_contact_id,
    pilot_id: body.pilot_id,
    passenger1_id: body.passenger1_id,
    passenger2_id: body.passenger2_id ?? null,
    status: body.status ?? "Draft",
    pre_ride_notes: body.pre_ride_notes ?? null,
    post_ride_notes: body.post_ride_notes ?? null,
  };
  const { data, error } = await supabase.from("ride_events").insert(insert).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data!.id, ok: true }, { status: 201 });
}
