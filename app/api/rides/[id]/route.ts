// app/api/rides/[id]/route.ts
import { NextResponse } from "next/server";
import { getAdminClient } from "@/app/lib/supabaseAdmin";

export const runtime = "nodejs";

type RideUpdate = {
  date?: string;
  ride_time?: string;
  pickup_location_id?: string;
  emergency_contact_id?: string;
  pilot_id?: string;
  passenger1_id?: string;
  passenger2_id?: string | null;
  status?: string | null;
  pre_ride_notes?: string | null;
  post_ride_notes?: string | null;
};

function idFromContext(ctx: any): string | null {
  const raw = ctx?.params?.id;
  return Array.isArray(raw) ? raw[0] : raw ?? null;
}

export async function GET(_req: Request, ctx: any) {
  const id = idFromContext(ctx);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("ride_events").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ ride: data });
}

export async function PATCH(req: Request, ctx: any) {
  const id = idFromContext(ctx);
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
  if (body.status !== undefined) update.status = body.status;
  if (body.pre_ride_notes !== undefined) update.pre_ride_notes = body.pre_ride_notes;
  if (body.post_ride_notes !== undefined) update.post_ride_notes = body.post_ride_notes;

  const supabase = getAdminClient();
  const { error } = await supabase.from("ride_events").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: any) {
  const id = idFromContext(ctx);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const supabase = getAdminClient();
  const { error } = await supabase.from("ride_events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
