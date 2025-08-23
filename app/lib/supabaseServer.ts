import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

function parseAccessToken(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      // Find first object with an access_token field
      for (const item of parsed) {
        if (item && typeof item === "object" && "access_token" in item && item.access_token) {
          return String((item as any).access_token);
        }
      }
    } else if (parsed && typeof parsed === "object" && "access_token" in parsed) {
      const t = (parsed as any).access_token;
      if (t) return String(t);
    }
  } catch {
    // not JSON; ignore
  }
  return undefined;
}

async function getAccessTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();

  // 1) New helpers cookie
  const direct = cookieStore.get("sb-access-token")?.value;
  if (direct) return direct;

  // 2) Legacy helpers cookie
  const legacy = cookieStore.get("supabase-auth-token")?.value;
  const fromLegacy = parseAccessToken(legacy);
  if (fromLegacy) return fromLegacy;

  // 3) v2 cookie pattern: sb-<project-ref>-auth-token
  for (const c of cookieStore.getAll()) {
    if (c.name.startsWith("sb-") && c.name.endsWith("-auth-token")) {
      const t = parseAccessToken(c.value);
      if (t) return t;
    }
  }

  return undefined;
}

export async function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const schema = process.env.NEXT_PUBLIC_DB_SCHEMA || "public";
  if (!url || !anon) {
    throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const accessToken = await getAccessTokenFromCookies();

  const supabase = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
    db: { schema },
  });

  return supabase;
}
