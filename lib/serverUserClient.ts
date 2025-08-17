
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Next.js 15: cookies() is async. Await it, then read sb-access-token.
export async function createServerUserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public';

  let access: string | undefined = undefined;
  try {
    const store = await cookies();
    access = store.get('sb-access-token')?.value;
  } catch {}

  return createClient(url, anon, {
    db: { schema },
    global: { headers: access ? { Authorization: `Bearer ${access}` } : {} },
    auth: { persistSession: false, detectSessionInUrl: false },
  });
}
