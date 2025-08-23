import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const sb = cookieStore.get("sb-access-token")?.value;
  if (sb) return sb;

  const legacy = cookieStore.get("supabase-auth-token")?.value;
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy);
      return parsed?.access_token ?? undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export async function getServerSupabase(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const token = await getAccessToken();

  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });

  return client;
}
