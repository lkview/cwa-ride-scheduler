'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'authed' | 'anon'>('loading');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setState(data.session ? 'authed' : 'anon');
    });
  }, []);

  if (state === 'loading') return <div className="p-6">Loading…</div>;
  if (state === 'anon') {
    return (
      <div className="p-6 space-y-2">
        <p>You must be signed in to view this page.</p>
        <Link className="underline" href="/login">Go to login</Link>
      </div>
    );
  }
  return <>{children}</>;
}
