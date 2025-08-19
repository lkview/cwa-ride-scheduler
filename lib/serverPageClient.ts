// lib/serverPageClient.ts
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client for App Router pages (Server Components).
 * - Uses anon key
 * - Forwards a Supabase access token from cookies if present (so RLS can use auth.uid()).
 * - Honors custom schema via NEXT_PUBLIC_SUPABASE_SCHEMA
 */
export async function createServerPageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public';

  // Next.js 15: cookies() is async → await it
  const jar = await cookies();

  const accessToken =
    jar.get('sb-access-token')?.value ??
    jar.get('access-token')?.value ??
    jar.get('supabase-auth-token')?.value; // fallback

  const supabase = createClient(url, anon, {
    db: { schema },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });

  return supabase;
}
