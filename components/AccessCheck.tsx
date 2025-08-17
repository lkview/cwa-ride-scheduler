// components/AccessCheck.tsx
'use client';

import { useEffect, useState } from 'react';

export default function AccessCheck() {
  const [info, setInfo] = useState<{ email?: string | null; role?: string | null; schema?: string }>();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/whoami', { cache: 'no-store' });
        setInfo(await res.json());
      } catch { /* ignore */ }
    })();
  }, []);

  if (!info) return null;

  return (
    <div className="w-full bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-2 text-sm">
      <b>ACCESS</b>: {info.email ?? 'anonymous'} &middot; role: <b>{info.role}</b> &middot; schema: <b>{info.schema}</b>
      {info.role === 'viewer' && (
        <span className="ml-2">
          — You’re a viewer on this preview. <a className="underline" href="/login">Sign in</a> with your DEV admin/scheduler.
        </span>
      )}
    </div>
  );
}
