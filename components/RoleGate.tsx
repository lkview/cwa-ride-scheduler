'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import DevAuth, { getDevRole } from './DevAuth';

type Role = 'admin'|'scheduler'|'pilot'|'viewer';

function isPreviewHost() {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return (/\.vercel\.app$/.test(h) && h !== 'cwa-ride-scheduler.vercel.app') || /-git-/.test(h);
}
const DEV = process.env.NEXT_PUBLIC_DEV_FAKE_AUTH === 'true' || isPreviewHost();

type Props = { allow: Array<'admin'|'scheduler'>; children: React.ReactNode };

export default function RoleGate({ allow, children }: Props) {
  if (DEV) {
    const role = getDevRole() as Role;
    return (
      <>
        <DevAuth />
        {allow.includes(role as any)
          ? <>{children}</>
          : <div className="p-4 text-red-600">You don’t have permission to access this page (role: {role}).</div>}
      </>
    );
  }

  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) { setRole(null); setLoading(false); return; }
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.session.user.id)
        .maybeSingle();
      if (error) setErr(error.message);
      setRole((data as any)?.role ?? null);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-4">Loading…</div>;
  if (err) return <div className="p-4 text-red-600">{err}</div>;
  if (!role || !allow.includes(role as any)) {
    return <div className="p-4 text-red-600">You don’t have permission to access this page.</div>;
  }
  return <>{children}</>;
}
