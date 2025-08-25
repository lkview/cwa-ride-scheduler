import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
    .from("people")
    .select("id, first_name, last_name")
    .order("last_name", { ascending: true, nullsFirst: false })
    .order("first_name", { ascending: true, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message || "Database error" }, { status: 500 });
  }
  return NextResponse.json({ people: data ?? [] }, { status: 200 });
}
