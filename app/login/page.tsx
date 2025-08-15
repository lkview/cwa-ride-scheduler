'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

/**
 * Login page:
 *  - Sends magic link via Supabase with redirect to PRODUCTION /auth/callback,
 *    which then forwards back to THIS origin's /login (preview-safe) carrying the hash.
 *  - If the URL already contains access_token/refresh_token in the hash, set the session
 *    and leave /login.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // If we arrive with a magic-link hash, finish sign-in here.
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash && hash.includes('access_token=') && hash.includes('refresh_token=')) {
      const sp = new URLSearchParams(hash.slice(1));
      const access_token = sp.get('access_token') || '';
      const refresh_token = sp.get('refresh_token') || '';
      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token })
          .then(({ error }) => {
            if (error) setErr(error.message);
            else router.replace('/ride-events');
          })
          .catch((e:any) => setErr(e?.message ?? 'Failed to set session'));
      }
    } else {
      // Already signed in? Leave /login.
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) router.replace('/ride-events');
      });
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') router.replace('/ride-events');
    });
    return () => {
      // @ts-ignore
      sub?.subscription?.unsubscribe?.();
    };
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null);
    try {
      const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://cwa-ride-scheduler.vercel.app';
      // Always redirect via PRODUCTION /auth/callback which forwards back to THIS origin's /login
      const emailRedirectTo = `${site}/auth/callback?next=${encodeURIComponent(window.location.origin + '/login')}`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo },
      });
      if (error) setErr(error.message);
      else setMsg('Check your email for a sign-in link.');
    } catch (e:any) {
      setErr(e?.message ?? 'Unexpected error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white border rounded">
      <h1 className="text-xl font-semibold mb-2">Sign in</h1>
      <p className="text-sm mb-4">Enter your email to get a magic link.</p>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.org"
          className="w-full border rounded px-3 py-2"
        />
        <button disabled={busy} className="px-3 py-2 rounded bg-black text-white disabled:opacity-60">
          {busy ? 'Sending…' : 'Send magic link'}
        </button>
      </form>
      {msg && <div className="mt-3 text-green-700">{msg}</div>}
      {err && <div className="mt-3 text-red-600">{err}</div>}
    </div>
  );
}
