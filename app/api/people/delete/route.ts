// app/api/people/delete/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getAccessTokenFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return (
    cookieStore.get("sb-access-token")?.value ||
    cookieStore.get("supabase-auth-token")?.value
  );
}

async function getSupabaseClientStrict(tokenFromHeader?: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const token = tokenFromHeader || (await getAccessTokenFromCookie());
  if (!token) return null;

  return createClient(url, anon, {
    auth: { persistSession: false, detectSessionInUrl: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const supabase = await getSupabaseClientStrict(tokenFromHeader);
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = (body?.id ?? "").toString();
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 422 });
  }

  const { error } = await supabase.rpc("people_delete", { p_person_id: id });
  if (error) {
    const code = /insufficient_privilege/i.test(error.message) ? 403 : 400;
    return NextResponse.json({ error: error.message }, { status: code });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
