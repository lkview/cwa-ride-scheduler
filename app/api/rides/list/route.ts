import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getAccessToken(): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get("sb-access-token")?.value || cookieStore.get("supabase-auth-token")?.value;
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const token = getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(url, anon, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });

  const today = new Date();
  const pastDate = new Date(today.getTime() - 30*24*60*60*1000).toISOString().slice(0,10);

  const { data, error } = await supabase
    .from('ride_events')
    .select(`
      id, date, meeting_time, start_at, status,
      pilot:people!ride_events_pilot_fk ( first_name, last_name ),
      p1:people!ride_events_passenger1_fk ( first_name, last_name ),
      p2:people!ride_events_passenger2_fk ( first_name, last_name ),
      ec:people!ride_events_emergency_contact_fk ( first_name, last_name )
    `)
    .gte('date', pastDate)
    .order('date', { ascending: true })
    .order('meeting_time', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).map((r: any) => {
    const ride_ts = r.start_at ?? (r.date && r.meeting_time ? `${r.date}T${r.meeting_time}` : null);
    return {
      id: r.id,
      ride_ts,
      status: r.status,
      title: null,
      notes: null,
      pilot_id: null,
      pilot_name: r.pilot ? `${r.pilot.first_name ?? ''} ${r.pilot.last_name ?? ''}`.trim() : null,
      passenger1_id: null,
      passenger1_name: r.p1 ? `${r.p1.first_name ?? ''} ${r.p1.last_name ?? ''}`.trim() : null,
      passenger2_id: null,
      passenger2_name: r.p2 ? `${r.p2.first_name ?? ''} ${r.p2.last_name ?? ''}`.trim() : null,
      emergency_contact_id: null,
      emergency_contact_name: r.ec ? `${r.ec.first_name ?? ''} ${r.ec.last_name ?? ''}`.trim() : null,
    };
  });

  return NextResponse.json({ rows });
}
