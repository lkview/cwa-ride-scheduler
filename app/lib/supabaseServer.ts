import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

/**
 * Robust server-side Supabase client for Next 15 route handlers.
 * - Reads access token from any Supabase cookie (handles array/object formats).
 * - Sends Authorization header so RLS recognizes the authenticated user.
 * - Targets correct schema (NEXT_PUBLIC_DB_SCHEMA | dev for preview | public for prod).
 * - Intentionally avoids explicit SupabaseClient<> generic return type to allow dynamic schema.
 */
export async function getServerSupabase() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Missing Supabase env vars");

  // Figure out schema
  const vercelEnv = process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV || "";
  const schema = process.env.NEXT_PUBLIC_DB_SCHEMA || (vercelEnv === "production" ? "public" : "dev");

  // Helpers
  const isJwt = (s?: string) => !!s && s.split(".").length === 3;
  const decodeMaybe = (v: string) => { try { return decodeURIComponent(v); } catch { return v; } };
  const parseJson = (v?: string) => {
    if (!v) return undefined;
    try { return JSON.parse(decodeMaybe(v)); } catch { return undefined; }
  };
  const findAccessToken = (node: any): string | undefined => {
    if (!node) return undefined;
    if (typeof node === "string" && isJwt(node)) return node;
    if (typeof node === "object") {
      // direct property
      if (typeof (node as any).access_token === "string" && isJwt((node as any).access_token)) {
        return (node as any).access_token;
      }
      // common shapes: { currentSession: { access_token: "..." } }
      if ((node as any).currentSession) {
        const tok = findAccessToken((node as any).currentSession);
        if (tok) return tok;
      }
      for (const k of Object.keys(node)) {
        const tok = findAccessToken((node as any)[k]);
        if (tok) return tok;
      }
    }
    if (Array.isArray(node)) {
      for (const item of node) {
        const tok = findAccessToken(item);
        if (tok) return tok;
      }
    }
    return undefined;
  };

  // 1) Direct cookie sometimes set by older helpers
  const direct = cookieStore.get("sb-access-token")?.value;
  let accessToken: string | undefined = isJwt(direct) ? direct : undefined;

  // 2) Scan for JSON cookies that contain access_token (legacy + project-scoped)
  if (!accessToken) {
    for (const c of cookieStore.getAll()) {
      const name = c.name || "";
      if (
        name === "supabase-auth-token" ||
        (name.startsWith("sb-") && name.endsWith("-auth-token"))
      ) {
        const candidate = findAccessToken(parseJson(c.value));
        if (candidate) { accessToken = candidate; break; }
      }
    }
  }

  // Build client with Authorization header if we found a token
  const headers: Record<string, string> = {};
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const client = createClient(url, anon, {
    global: { headers },
    db: { schema },
    auth: { persistSession: false },
  });

  return client;
}
