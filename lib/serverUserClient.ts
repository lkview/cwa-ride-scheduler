// lib/serverUserClient.ts
// Server-side Supabase client that forwards the user's access token.
import { createClient } from '@supabase/supabase-js';

export async function createServerUserClient(req?: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public';

  // Prefer Authorization header (sent from browser)
  let accessToken: string | undefined;
  try {
    const authHeader = req?.headers?.get('authorization') || req?.headers?.get('Authorization');
    if (authHeader) accessToken = authHeader.replace(/^Bearer\s+/i, '');
  } catch {}

  return createClient(url, anon, {
    db: { schema },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
    auth: { persistSession: false, detectSessionInUrl: false },
  });
}
