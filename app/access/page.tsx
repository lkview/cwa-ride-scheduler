// app/access/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Who = {
  env: string;
  schema: string;
  devFakeAuth: boolean;
  email: string | null;
  user_id: string | null;
  role: string | null;
  pilot_id: string | null;
  hasAccess: boolean;
  hasRefresh: boolean;
  userErr?: string | null;
};

export default function AccessPage() {
  const [who, setWho] = useState<Who | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/whoami', {
          cache: 'no-store',
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        setWho(await res.json());
      } catch (e: any) {
        setErr(e?.message ?? 'Failed to load');
      }
    })();
  }, []);

  return (
    <main className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Access Debug</h1>
      {err && <p className="text-red-600">{err}</p>}
      <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
        {JSON.stringify(who, null, 2)}
      </pre>
      <p className="mt-4 text-sm text-gray-600">
        If <b>role</b> is <code>viewer</code> here but you're logged in as admin/scheduler/pilot,
        try signing out and back in. In Preview, you can also use the dev bar to log in as a test user.
      </p>
    </main>
  );
}
