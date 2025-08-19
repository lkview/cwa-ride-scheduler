// lib/serverPageClient.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase client for Server Components (pages in /app).
 * We only need to READ cookies here, so set/remove can be no-ops.
 */
export async function createServerPageClient() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          /* no-op for RSC reads */
        },
        remove() {
          /* no-op for RSC reads */
        },
      },
    }
  );

  return supabase;
}
