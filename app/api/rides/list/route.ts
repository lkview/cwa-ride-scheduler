import { NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await getServerSupabase();
  const today = new Date();
  const past = new Date(today);
  past.setDate(past.getDate() - 30);
  const pastISO = past.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("ride_events")
    .select(`
      id, date, meeting_time, status, start_at,
      pickup:pickup_locations ( id, name, address ),
      pilot:people!ride_events_pilot_id_fkey ( id, first_name, last_name ),
      emergency:people!ride_events_emergency_contact_id_fkey ( id, first_name, last_name ),
      p1:people!ride_events_passenger1_id_fkey ( id, first_name, last_name ),
      p2:people!ride_events_passenger2_id_fkey ( id, first_name, last_name )
    `)
    .gte("date", pastISO)
    .order("date", { ascending: true })
    .order("meeting_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const shaped = (data || []).map((r: any) => ({
    id: r.id,
    date: r.date,
    meeting_time: r.meeting_time,
    status: r.status,
    start_at: r.start_at,
    pickup: r.pickup ? { id: r.pickup.id, name: r.pickup.name, address: r.pickup.address } : null,
    pilot_name: r.pilot ? `${r.pilot.first_name ?? ""} ${r.pilot.last_name ?? ""}`.trim() : null,
    emergency_name: r.emergency ? `${r.emergency.first_name ?? ""} ${r.emergency.last_name ?? ""}`.trim() : null,
    passenger1_name: r.p1 ? `${r.p1.first_name ?? ""} ${r.p1.last_name ?? ""}`.trim() : null,
    passenger2_name: r.p2 ? `${r.p2.first_name ?? ""} ${r.p2.last_name ?? ""}`.trim() : null,
  }));

  return NextResponse.json({ rides: shaped });
}
