import { NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Record<string, any>;

function nameFromRow(r: Row): string {
  const first = r.first_name || r.firstname || r.first || "";
  const last = r.last_name || r.lastname || r.last || "";
  const full = [first, last].filter(Boolean).join(" ").trim();
  return r.name || r.full_name || r.display_name || full || r.email || "Unknown";
}
function idFromRow(r: Row): string | null {
  return r.id || r.person_id || r.user_id || r.contact_id || null;
}
function normalize(rows: Row[] | null | undefined): { id: string; name: string }[] {
  if (!rows) return [];
  const out: { id: string; name: string }[] = [];
  for (const r of rows) {
    const id = idFromRow(r);
    if (id) out.push({ id: String(id), name: nameFromRow(r) });
  }
  // stable sort by name
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

async function safeSelect(supabase: any, table: string, columns: string) {
  try {
    const { data, error } = await supabase.from(table).select(columns);
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e?.message || "query failed" };
  }
}

export async function GET() {
  const supabase = await getServerSupabase();

  // Pickups from public.pickup_locations
  const { data: pickupsData, error: pickupsErr } = await supabase
    .from("pickup_locations")
    .select("id,name,address,notes")
    .order("name");

  // Try role-specific views if they exist, otherwise fallback to people
  let pilots = normalize(null);
  let passengers = normalize(null);
  let contacts = normalize(null);

  // pilots
  let q = await safeSelect(supabase, "pilots", "id,name,first_name,last_name,display_name,full_name,email");
  if (!q.error && q.data && q.data.length) {
    pilots = normalize(q.data);
  } else {
    const { data } = await supabase.from("people").select("id,first_name,last_name,name,email").order("last_name");
    pilots = normalize(data);
  }

  // passengers
  q = await safeSelect(supabase, "passengers", "id,name,first_name,last_name,display_name,full_name,email");
  if (!q.error && q.data && q.data.length) {
    passengers = normalize(q.data);
  } else {
    const { data } = await supabase.from("people").select("id,first_name,last_name,name,email").order("last_name");
    passengers = normalize(data);
  }

  // emergency contacts
  q = await safeSelect(supabase, "emergency_contacts", "id,name,first_name,last_name,display_name,full_name,email");
  if (!q.error && q.data && q.data.length) {
    contacts = normalize(q.data);
  } else {
    const { data } = await supabase.from("people").select("id,first_name,last_name,name,email").order("last_name");
    contacts = normalize(data);
  }

  return NextResponse.json({
    schemaUsed: "public",
    pickups: pickupsData ?? [],
    pickupsError: pickupsErr || null,
    pilots,
    passengers,
    emergency_contacts: contacts,
  });
}
