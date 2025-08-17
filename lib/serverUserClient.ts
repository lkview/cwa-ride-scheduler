
// Minimal server-side Supabase client that uses the current user's session
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export function createServerUserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public';

  const access = cookies().get('sb-access-token')?.value;

  return createClient(url, anon, {
    db: { schema },
    global: {
      headers: access ? { Authorization: `Bearer ${access}` } : {}
    },
    auth: { persistSession: false, detectSessionInUrl: false }
  });
}
