// app/api/rides/options/route.ts
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabaseServer";

// Helper: safest label we can derive from a row
function displayName(r: any) {
  const fn = (r?.first_name ?? "").trim();
  const ln = (r?.last_name ?? "").trim();
  const full = [fn, ln].filter(Boolean).join(" ").trim();
  return (
    full ||
    r?.display_name ||
    r?.name ||
    r?.email ||
    r?.phone ||
    "Unnamed"
  );
}

// Normalize a person row into what the UI already understands
function personOut(r: any) {
  return {
    id: r.id,
    first_name: r.first_name ?? null,
    last_name: r.last_name ?? null,
    email: r.email ?? null,
    phone: r.phone ?? null,
    display_name: displayName(r),
  };
}

// Normalize a pickup row
function pickupOut(r: any) {
  return {
    id: r.id,
    name: r.name ?? r.display_name ?? r.title ?? "Pickup",
    address: r.address ?? null,
    notes: r.notes ?? null,
  };
}

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await getServerSupabase();

  // Use the SECURITY DEFINER roster view so RLS won’t block us.
  // It includes: id, first_name, last_name, email, phone, roles (array), roles_title, etc.
  const baseSelect =
    "id, first_name, last_name, email, phone, roles";

  // Everyone who can be a passenger = full roster (any role)
  const { data: roster, error: rosterErr } = await supabase
    .from("people_roster_v")
    .select(baseSelect)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (rosterErr) {
    // If the view somehow fails, don’t silently widen access; fail loud.
    return NextResponse.json(
      { error: `Failed to load roster: ${rosterErr.message}` },
      { status: 500 }
    );
  }

  const rows = roster ?? [];

  // Filter by roles from the roster view
  const hasRole = (r: any, key: string) =>
    Array.isArray(r?.roles) && r.roles.includes(key);

  const pilots = rows.filter((r) => hasRole(r, "pilot")).map(personOut);
  const emergency_contacts = rows
    .filter((r) => hasRole(r, "emergency_contact"))
    .map(personOut);
  const passengers = rows.map(personOut); // requirement: passengers list = anyone

  // Pickups as before
  const { data: pickupsRaw, error: pickupsErr } = await supabase
    .from("pickup_locations")
    .select("id, name, address, notes")
    .order("name", { ascending: true });

  if (pickupsErr) {
    return NextResponse.json(
      { error: `Failed to load pickups: ${pickupsErr.message}` },
      { status: 500 }
    );
  }

  const pickups = (pickupsRaw ?? []).map(pickupOut);

  // Keep the exact shape the page expects
  return NextResponse.json({
    pilots,
    passengers,
    emergency_contacts,
    pickups,
  });
}
