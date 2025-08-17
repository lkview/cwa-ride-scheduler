// app/api/whoami/route.ts
import { cookies } from 'next/headers';

export function GET() {
  // NOTE: cookies() is synchronous — don't "await" it.
  const c = cookies();

  // Supabase auth cookies (presence only; don't print secrets)
  const access = c.get('sb-access-token')?.value ?? null;
  const refresh = c.get('sb-refresh-token')?.value ?? null;

  // DEV helpers
  const devFakeAuth = process.env.NEXT_PUBLIC_DEV_FAKE_AUTH === 'true';
  const devRole = c.get('dev-role')?.value ?? 'viewer';

  return Response.json({
    env: process.env.VERCEL_ENV ?? 'local',
    schema: process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? 'public',
    devFakeAuth,
    devRole,
    hasAccess: Boolean(access),
    hasRefresh: Boolean(refresh),
    // (nothing sensitive exposed)
  });
}
