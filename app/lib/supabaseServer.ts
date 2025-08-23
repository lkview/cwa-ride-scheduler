import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type TokenJSON = { access_token?: string; refresh_token?: string } | undefined;

function parseJSONCookie(raw?: string): TokenJSON {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/**
 * Server-side Supabase client for Route Handlers/pages.
 * - Next.js 15: await cookies()
 * - Sends Authorization: Bearer <access_token> so RLS sees the logged-in user
 * - Uses the correct schema (dev in Preview by default; public in Production)
 */
export async function getServerSupabase(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  // Resolve schema: explicit env var OR dev for previews, public for prod
  const schema =
    process.env.NEXT_PUBLIC_DB_SCHEMA ||
    (process.env.VERCEL_ENV === "production" ? "public" : "dev");

  // 1) Try modern cookie (raw JWT)
  let accessToken = cookieStore.get("sb-access-token")?.value;

  // 2) Try project-scoped JSON cookie: sb-<project-ref>-auth-token
  if (!accessToken) {
    const match = url.match(/^https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
    const projectRef = match?.[1];
    if (projectRef) {
      const scoped = cookieStore.get(`sb-${projectRef}-auth-token`)?.value;
      const parsed = parseJSONCookie(scoped);
      accessToken = parsed?.access_token;
    }
  }

  // 3) Try legacy JSON cookie
  if (!accessToken) {
    const legacy = parseJSONCookie(cookieStore.get("supabase-auth-token")?.value);
    accessToken = legacy?.access_token;
  }

  const client = createClient(url, anon, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
      // We are injecting Authorization header below, so no need to store session server-side.
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
    db: { schema },
  });

  return client;
}
