import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getAccessTokenFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("sb-access-token")?.value || cookieStore.get("supabase-auth-token")?.value;
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
  const id: string | null = body?.id || null;
  const name: string | null = (body?.name || '').trim() || null;
  const address: string | null = (body?.address || '').trim() || null;
  const notes: string | null = (body?.notes || '').trim() || null;
  if (!id || !name || !address) return NextResponse.json({ error: "Missing id, name, or address" }, { status: 400 });

  const { error } = await supabase.from('pickup_locations').update({ name, address, notes: notes || null }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
