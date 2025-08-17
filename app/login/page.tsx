'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setErr(null); setBusy(true);
    try {
      if (pw) {
        // Email + Password login (DEV friendly, no magic link)
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        // session stored by supabase-js; go home
        window.location.href = '/';
      } else {
        // Fallback: magic link (still works if you want it)
        const emailRedirectTo = `${window.location.origin}/auth/callback`;
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } });
        if (error) throw error;
        setMsg('Check your email for a sign-in link.');
      }
    } catch (e: any) {
      setErr(e.message ?? 'Unexpected error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white border rounded">
      <h1 className="text-xl font-semibold mb-3">Sign in</h1>
      <p className="text-sm mb-4">
        Enter your email and either a password (DEV) or leave password blank to get a magic link.
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.org"
          className="w-full border rounded px-3 py-2"
        />
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          placeholder="password (optional)"
          className="w-full border rounded px-3 py-2"
        />
        <button disabled={busy} className="px-3 py-2 rounded bg-black text-white disabled:opacity-60">
          {busy ? 'Signing in…' : (pw ? 'Sign in (password)' : 'Send magic link')}
        </button>
      </form>
      {msg && <div className="mt-3 text-green-700">{msg}</div>}
      {err && <div className="mt-3 text-red-600">{err}</div>}
    </div>
  );
}
