import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

function parseTokenFromCookies(all: { name: string; value: string }[]) {
  const isJwt = (s?: string) => !!s && s.split(".").length === 3;
  const tryParse = (v?: string) => {
    if (!v) return undefined;
    try { return JSON.parse(decodeURIComponent(v)); } catch { return undefined; }
  };
  const findAccessToken = (node: any): string | undefined => {
    if (!node) return undefined;
    if (typeof node === "string" && isJwt(node)) return node;
    if (typeof node === "object") {
      if (typeof node.access_token === "string" && isJwt(node.access_token)) return node.access_token;
      if (node.currentSession) {
        const t = findAccessToken(node.currentSession);
        if (t) return t;
      }
      for (const k of Object.keys(node)) {
        const t = findAccessToken((node as any)[k]);
        if (t) return t;
      }
    }
    if (Array.isArray(node)) {
      for (const item of node) {
        const t = findAccessToken(item);
        if (t) return t;
      }
    }
    return undefined;
  };

  const direct = all.find(c => c.name === "sb-access-token")?.value;
  if (direct && isJwt(direct)) return direct;

  for (const c of all) {
    if (c.name === "supabase-auth-token" || (c.name.startsWith("sb-") && c.name.endsWith("-auth-token"))) {
      const t = findAccessToken(tryParse(c.value));
      if (t) return t;
    }
  }
  return undefined;
}

async function countRows(schema: "dev" | "public", token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const headers: Record<string,string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const client = createClient(url, anon, { db: { schema }, global: { headers } });
  const { data, error } = await client.from("pickup_locations").select("id", { count: "exact" });
  return { schema, count: (data || []).length, error: error?.message };
}

export async function GET() {
  const store = await cookies();
  const all = store.getAll().map(c => ({ name: c.name, value: c.value }));
  const token = parseTokenFromCookies(all);

  const dev = await countRows("dev", token);
  const pub = await countRows("public", token);
  const env = process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV || "unknown";

  return NextResponse.json({ env, tokenPresent: !!token, dev, public: pub });
}
