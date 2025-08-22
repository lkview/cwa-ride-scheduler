
// app/api/roles/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getSupabaseForRoute() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-only

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (accessToken) {
    return createClient(url, anon, {
      auth: { persistSession: false, detectSessionInUrl: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }

  if (serviceKey) {
    return createClient(url, serviceKey, {
      auth: { persistSession: false, detectSessionInUrl: false, autoRefreshToken: false },
    });
  }

  return createClient(url, anon, {
    auth: { persistSession: false, detectSessionInUrl: false, autoRefreshToken: false },
  });
}

export async function GET() {
  const supabase = await getSupabaseForRoute();
  const { data, error } = await supabase.from("roles").select("name").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}
