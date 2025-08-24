import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase server client that ALWAYS uses the 'public' schema.
 * Useful to simplify dev vs prod until we introduce explicit environments.
 */
export async function getServerSupabase() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Missing Supabase env vars");

  // Find access token in cookies (optional)
  const isJwt = (s?: string) => !!s && s.split(".").length === 3;
  const tryJson = (s?: string) => { try { return s ? JSON.parse(decodeURIComponent(s)) : undefined; } catch { return undefined; } };
  const token =
    cookieStore.get("sb-access-token")?.value && isJwt(cookieStore.get("sb-access-token")!.value)
      ? cookieStore.get("sb-access-token")!.value
      : (() => {
          for (const c of cookieStore.getAll()) {
            if (c.name === "supabase-auth-token" || (c.name.startsWith("sb-") && c.name.endsWith("-auth-token"))) {
              const j = tryJson(c.value);
              const t = j?.access_token || j?.currentSession?.access_token || (Array.isArray(j) ? j.find((x: any) => x?.access_token)?.access_token : undefined);
              if (t && isJwt(t)) return t as string;
            }
          }
          return undefined;
        })();

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return createClient(url, anon, {
    global: { headers },
    db: { schema: "public" }
  });
}
