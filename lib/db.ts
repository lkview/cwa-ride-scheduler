// lib/db.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public';

/**
 * Server-only Supabase client using the service role.
 * Use ONLY in server components / server actions.
 */
export function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    db: { schema: SCHEMA },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
