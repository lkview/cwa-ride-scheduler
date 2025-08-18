// app/access/page.tsx
'use client';

import { useEffect, useState } from 'react';

type Who = {
  email: string | null;
  user_id: string | null;
  role: string | null;
  pilot_id: string | null;
  schema: string;
};

export default function AccessPage() {
  const [who, setWho] = useState<Who | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/whoami', { cache: 'no-store' });
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
        If <b>role</b> is <code>viewer</code> here, sign out, then go to <code>/login</code> on this same
        preview and log in as your <b>DEV</b> admin/scheduler email. Open the magic link, then refresh this page.
      </p>
    </main>
  );
}
