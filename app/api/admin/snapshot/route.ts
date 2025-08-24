import { NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabaseServer";

export async function GET() {
  const supabase = await getServerSupabase();

  const can = await supabase.rpc("can_schedule_rides");
  if (can.error || can.data !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [people, pickups, rides] = await Promise.all([
    supabase.from("people").select("id, first_name, last_name, phone, email, address, notes, hidden, created_at, updated_at"),
    supabase.from("pickup_locations").select("id, name, address, notes, lat, lng, created_at, updated_at"),
    supabase.from("ride_events").select(`
      id, date, meeting_time, status, start_at, pre_ride_notes, post_ride_notes,
      pickup:pickup_locations ( id, name, address ),
      pilot:people!ride_events_pilot_id_fkey ( id, first_name, last_name ),
      emergency:people!ride_events_emergency_contact_id_fkey ( id, first_name, last_name ),
      p1:people!ride_events_passenger1_id_fkey ( id, first_name, last_name ),
      p2:people!ride_events_passenger2_id_fkey ( id, first_name, last_name )
    `),
  ]);

  const snapshot = {
    people: people.data || [],
    pickup_locations: pickups.data || [],
    rides: (rides.data || []).map((r: any) => ({
      id: r.id,
      date: r.date,
      meeting_time: r.meeting_time,
      status: r.status,
      start_at: r.start_at,
      pre_ride_notes: r.pre_ride_notes,
      post_ride_notes: r.post_ride_notes,
      pickup: r.pickup ? { id: r.pickup.id, name: r.pickup.name, address: r.pickup.address } : null,
      pilot_name: r.pilot ? `${r.pilot.first_name ?? ""} ${r.pilot.last_name ?? ""}`.trim() : null,
      emergency_name: r.emergency ? `${r.emergency.first_name ?? ""} ${r.emergency.last_name ?? ""}`.trim() : null,
      passenger1_name: r.p1 ? `${r.p1.first_name ?? ""} ${r.p1.last_name ?? ""}`.trim() : null,
      passenger2_name: r.p2 ? `${r.p2.first_name ?? ""} ${r.p2.last_name ?? ""}`.trim() : null,
    })),
    generated_at: new Date().toISOString(),
  };

  return NextResponse.json(snapshot);
}
