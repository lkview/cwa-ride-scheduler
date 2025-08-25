import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";

type RideUpdate = {
  date?: string | null;
  ride_time?: string | null;
  status?: string | null;
  pickup_location_id?: string | null;
  emergency_contact_id?: string | null;
  pilot_id?: string | null;
  passenger1_id?: string | null;
  passenger2_id?: string | null;
  pre_ride_notes?: string | null;
};

function toDbStatusLower(s?: string | null) {
  const v = String(s || "").toLowerCase().trim();
  if (v === "confirmed") return "confirmed";
  if (v === "completed") return "completed";
  if (v === "canceled" || v === "cancelled") return "canceled";
  if (v === "tentative") return "tentative";
  return undefined as any;
}

export async function PATCH(req: Request, context: any) {
  const id = String(context?.params?.id || "");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as RideUpdate;
  const update: any = {};
  if (body.date !== undefined) update.date = body.date;
  if (body.ride_time !== undefined) update.meeting_time = body.ride_time;
  if (body.pickup_location_id !== undefined) update.pickup_location_id = body.pickup_location_id;
  if (body.emergency_contact_id !== undefined) update.emergency_contact_id = body.emergency_contact_id;
  if (body.pilot_id !== undefined) update.pilot_id = body.pilot_id;
  if (body.passenger1_id !== undefined) update.passenger1_id = body.passenger1_id;
  if (body.passenger2_id !== undefined) update.passenger2_id = body.passenger2_id;
  if (body.pre_ride_notes !== undefined) update.pre_ride_notes = body.pre_ride_notes;
  if (body.status !== undefined) update.status = toDbStatusLower(body.status);

  const { error } = await supabase.from("ride_events").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, context: any) {
  const id = String(context?.params?.id || "");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { error } = await supabase.from("ride_events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
