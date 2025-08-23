import { cookies } from "next/headers";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Build a server-side Supabase client that sends the user's
 * access token in the Authorization header so RLS sees the user.
 *
 * Works on Next.js 15 (cookies() is async).
 */
export async function getServerSupabase(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const accessToken = readAccessTokenFromCookies(cookieStore);

  // Attach Authorization header when we have a token.
  const client = createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  });

  return client;
}

/**
 * Tries multiple cookie shapes used by Supabase helpers across versions:
 * 1) "sb-access-token" => raw JWT
 * 2) "sb-<ref>-auth-token" => JSON with { access_token, refresh_token, ... }
 * 3) "supabase-auth-token" => legacy JSON cookie
 */
function readAccessTokenFromCookies(cookieStore: any): string | undefined {
  // 1) Straight token
  const direct = cookieStore.get("sb-access-token")?.value;
  if (direct) return direct;

  // Helper to safely parse JSON cookie values
  const parseJson = (val: string | undefined) => {
    if (!val) return undefined;
    try {
      const parsed = JSON.parse(val);
      // Some helpers nest as { currentSession: { access_token } }
      if (parsed?.access_token) return parsed.access_token as string;
      if (parsed?.currentSession?.access_token) return parsed.currentSession.access_token as string;
      if (Array.isArray(parsed) && parsed[0]?.access_token) return parsed[0].access_token as string;
      return undefined;
    } catch {
      return undefined;
    }
  };

  // 2) Any cookie that looks like sb-<project>-auth-token
  for (const c of cookieStore.getAll()) {
    if (c.name.startsWith("sb-") && c.name.endsWith("-auth-token")) {
      const tok = parseJson(c.value);
      if (tok) return tok;
    }
  }

  // 3) Legacy
  const legacy = parseJson(cookieStore.get("supabase-auth-token")?.value);
  if (legacy) return legacy;

  return undefined;
}
