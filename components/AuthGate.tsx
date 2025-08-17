'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import DevAuth from './DevAuth';

function isPreviewHost() {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return (/\.vercel\.app$/.test(h) && h !== 'cwa-ride-scheduler.vercel.app') || /-git-/.test(h);
}
const DEV = process.env.NEXT_PUBLIC_DEV_FAKE_AUTH === 'true' || isPreviewHost();

export default function AuthGate({ children }: { children: React.ReactNode }) {
  if (DEV) {
    return <><DevAuth />{children}</>;
  }

  const [ok, setOk] = useState<boolean>(false);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setOk(!!session);
      setBusy(false);
    })();
  }, []);

  if (busy) return <div className="p-4">Loading…</div>;
  if (!ok) return (
    <div className="p-4">
      <p className="mb-3">You need to sign in.</p>
      <a className="underline" href="/login">Go to Login</a>
    </div>
  );
  return <>{children}</>;
}
