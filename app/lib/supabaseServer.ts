import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client for Next.js 15 route handlers.
 * - Awaits cookies() (Next 15)
 * - Reads access token from common Supabase cookies
 * - Sends Authorization header so RLS treats requests as the logged-in user
 * - Targets the correct schema (NEXT_PUBLIC_DB_SCHEMA or dev/public by env)
 *
 * IMPORTANT: No explicit SupabaseClient<> return type is used here so that
 * TypeScript won't complain when a dynamic schema is supplied.
 */
export async function getServerSupabase() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  // Resolve schema: explicit env overrides; otherwise dev for preview, public for prod
  const vercelEnv = process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV || "";
  const schema =
    process.env.NEXT_PUBLIC_DB_SCHEMA ||
    (vercelEnv === "production" ? "public" : "dev");

  // Try to read an access token from known cookie names
  const readAccessToken = (): string | undefined => {
    const direct = cookieStore.get("sb-access-token")?.value;
    if (direct) return direct;

    // Check for JSON cookies created by Supabase helpers
    const tryParseJsonToken = (raw: string | undefined) => {
      if (!raw) return undefined;
      try {
        const parsed = JSON.parse(raw);
        // supabase-auth-token can be an array or object depending on helper version
        if (Array.isArray(parsed)) {
          // Newer helpers store an array of { access_token, refresh_token }
          return parsed[0]?.access_token || parsed.find((x: any) => x?.access_token)?.access_token;
        }
        return parsed?.access_token;
      } catch {
        return undefined;
      }
    };

    const legacy = cookieStore.get("supabase-auth-token")?.value;
    const legacyToken = tryParseJsonToken(legacy);
    if (legacyToken) return legacyToken;

    // sb-<project-ref>-auth-token
    const all = (cookieStore as any).getAll?.() || [];
    const proj = all.find((c: any) => typeof c?.name === "string" && /sb-[A-Za-z0-9_-]+-auth-token/.test(c.name));
    const projToken = tryParseJsonToken(proj?.value);
    if (projToken) return projToken;

    return undefined;
  };

  const accessToken = readAccessToken();

  // Build client. We pass schema + Authorization header.
  const client = createClient(url, anon, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
    db: { schema }, // dynamic schema (dev/public) without strict TS generics
  });

  return client; // Intentionally untyped (lets TS infer)
}
