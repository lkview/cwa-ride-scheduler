// app/emergency-contacts/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function NewEmergencyContactPage() {
  const r = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      // Get the user's session token and forward it to the API route
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/emergency-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ name, phone, email, notes }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to create contact');
      r.push('/emergency-contacts');
    } catch (e: any) {
      setErr(e.message || 'Unexpected error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">New Emergency Contact</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="border p-3 rounded" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
          <input className="border p-3 rounded" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} required />
        </div>
        <input className="border p-3 rounded w-full" placeholder="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} />
        <textarea className="border p-3 rounded w-full" placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
        <button disabled={busy} className="border px-4 py-2 rounded">{busy ? 'Creating…' : 'Create Contact'}</button>
        {err && <p className="text-red-600 mt-2">{err}</p>}
      </form>
    </div>
  );
}
