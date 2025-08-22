// app/api/people/update/route.ts
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

type Payload = {
  p_person_id: string;
  p_first_name: string;
  p_last_name?: string | null;
  p_phone?: string | null;
  p_email?: string | null;
  p_roles?: string[] | null;
};

function sanitize(payload: any): Payload | null {
  if (!payload || typeof payload !== "object") return null;
  const p_person_id = (payload.p_person_id ?? "").toString();
  const p_first_name = (payload.p_first_name ?? "").toString();
  const p_last_name = payload.p_last_name == null ? null : String(payload.p_last_name);
  const p_phone = payload.p_phone == null ? null : String(payload.p_phone);
  const p_email = payload.p_email == null ? null : String(payload.p_email);
  const roles = Array.isArray(payload.p_roles) ? payload.p_roles.map(String) : null;
  return { p_person_id, p_first_name, p_last_name, p_phone, p_email, p_roles: roles };
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const supabase = await getSupabaseClientStrict(tokenFromHeader);
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const payload = sanitize(body);
  if (!payload || !payload.p_person_id || !payload.p_first_name?.trim()) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 422 });
  }

  const { error } = await supabase.rpc("people_update_with_roles_v2", payload as any);
  if (error) {
    const code = /insufficient_privilege/i.test(error.message) ? 403 : 400;
    return NextResponse.json({ error: error.message }, { status: code });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
