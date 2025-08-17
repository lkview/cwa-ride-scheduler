// app/api/whoami/route.ts
import { cookies } from 'next/headers';

export async function GET() {
  // In route handlers, cookies() can be async in Next 15 ⇒ await it
  const c = await cookies();

  // Supabase auth cookies (presence only)
  const access  = c.get('sb-access-token')?.value ?? null;
  const refresh = c.get('sb-refresh-token')?.value ?? null;

  // DEV helpers
  const devFakeAuth = process.env.NEXT_PUBLIC_DEV_FAKE_AUTH === 'true';
  const devRole     = c.get('dev-role')?.value ?? 'viewer';

  return Response.json({
    env: process.env.VERCEL_ENV ?? 'local',
    schema: process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? 'public',
    devFakeAuth,
    devRole,
    hasAccess:  Boolean(access),
    hasRefresh: Boolean(refresh),
  });
}
