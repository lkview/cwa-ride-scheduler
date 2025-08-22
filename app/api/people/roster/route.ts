// app/api/people/roster/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Build a Supabase client that forwards the user's session (JWT from cookies)
// so Row-Level Security applies to the logged-in user.
async function getSupabaseForRoute() {
  const cookieStore = await cookies(); // Next.js 15: cookies() is async
  const accessToken = cookieStore.get("sb-access-token")?.value;

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
        autoRefreshToken: false,
      },
      global: {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      },
    }
  );

  return client;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const sort = (searchParams.get("sort") || "last").toLowerCase(); // "last" | "role"
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.min(Math.max(1, Number(searchParams.get("pageSize") || "200")), 500);

  const supabase = await getSupabaseForRoute();

  let query = supabase.from("people_roster_v").select("*", { count: "exact" });

  if (q) {
    const like = `%${q}%`;
    query = query.or(
      [
        `first_name.ilike.${like}`,
        `last_name.ilike.${like}`,
        `phone.ilike.${like}`,
        `email.ilike.${like}`,
        `roles_title.ilike.${like}`,
      ].join(",")
    );
  }

  if (sort === "role") {
    query = query
      .order("roles_title", { ascending: true, nullsFirst: true })
      .order("last_name_sort", { ascending: true })
      .order("first_name_sort", { ascending: true });
  } else {
    query = query
      .order("last_name_sort", { ascending: true })
      .order("first_name_sort", { ascending: true });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ rows: data ?? [], count: count ?? 0 });
}
