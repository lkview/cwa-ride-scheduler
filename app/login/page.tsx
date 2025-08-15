'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // If already signed in (or the magic link just returned), leave /login
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/ride-events');
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') router.replace('/ride-events');
    });
    return () => {
      // @ts-ignore – handles different supabase versions gracefully
      sub?.subscription?.unsubscribe?.();
    };
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null);
    try {
      // Critical: send magic link back to this exact origin's /login (works for Preview & Prod)
      const emailRedirectTo = `${window.location.origin}/login`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo },
      });
      if (error) setErr(error.message);
      else setMsg('Check your email for a sign-in link.');
    } catch (e: any) {
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
