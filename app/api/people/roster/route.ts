// app/api/people/roster/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isPreviewMode() {
  return process.env.NEXT_PUBLIC_ENV === "preview" || process.env.VERCEL_ENV === "preview";
}

async function getAccessTokenFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return (
    cookieStore.get("sb-access-token")?.value ||
    cookieStore.get("supabase-auth-token")?.value
  );
}

async function getSupabaseClient(tokenFromHeader?: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const token = tokenFromHeader || (await getAccessTokenFromCookie());

  if (token) {
    return createClient(url, anon, {
      auth: { persistSession: false, detectSessionInUrl: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
  }

  // In Preview only, allow service role to read the roster
  if (serviceKey && isPreviewMode()) {
    return createClient(url, serviceKey, {
      auth: { persistSession: false, detectSessionInUrl: false, autoRefreshToken: false },
    });
  }

  return null;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const supabase = await getSupabaseClient(tokenFromHeader);
  if (!supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("people_roster_v")
    .select("id, first_name, last_name, phone, email, roles, roles_title, first_name_sort, last_name_sort")
    .order("last_name_sort", { ascending: true })
    .order("first_name_sort", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}
