// app/api/whoami/route.ts
import { NextResponse } from 'next/server';
import { createServerUserClient } from '@/lib/serverUserClient';

export async function GET(req: Request) {
  const supabase = await createServerUserClient(req);

  // Try to fetch the authenticated user (works when Authorization: Bearer <token> is present)
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const email = userData?.user?.email ?? null;
  const user_id = userData?.user?.id ?? null;

  // Ask Postgres for the role/pilot_id using the current schema (public/dev)
  let role: string | null = null;
  let pilot_id: string | null = null;
  try {
    const { data: r } = await supabase.rpc('app_role');
    role = (r as any) ?? null;
  } catch {}
  try {
    const { data: p } = await supabase.rpc('app_pilot_id');
    pilot_id = (p as any)?.toString?.() ?? (p as any) ?? null;
  } catch {}

  const env    = process.env.VERCEL_ENV ?? 'local';
  const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? 'public';
  const devFakeAuth = process.env.NEXT_PUBLIC_DEV_FAKE_AUTH === 'true';

  // If we got a user, we have access. Otherwise we're likely anon.
  const hasAccess = Boolean(user_id);
  const hasRefresh = false; // we no longer rely on cookies here

  return NextResponse.json({
    env,
    schema,
    devFakeAuth,
    email,
    user_id,
    role: role ?? 'viewer',
    pilot_id,
    hasAccess,
    hasRefresh,
    userErr: userErr?.message ?? null,
  });
}
