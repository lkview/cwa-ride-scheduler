
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPilotPage() {
  const r = useRouter();
  const [form, setForm] = useState({ first_name:'', last_name:'', phone:'', email:'', address:'', notes:'' });
  const [err, setErr] = useState<string|null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const res = await fetch('/api/pilots', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create');
      r.push('/pilots');
    } catch (e:any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  function f<K extends keyof typeof form>(k:K) {
    return (e: any) => setForm(s => ({ ...s, [k]: e.target.value }));
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">New Pilot</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="First name" value={form.first_name} onChange={f('first_name')} required />
          <input className="border rounded px-3 py-2" placeholder="Last name"  value={form.last_name}  onChange={f('last_name')}  required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Phone" value={form.phone} onChange={f('phone')} required />
          <input className="border rounded px-3 py-2" type="email" placeholder="Email" value={form.email} onChange={f('email')} required />
        </div>
        <input className="border rounded px-3 py-2 w-full" placeholder="Address (optional)" value={form.address} onChange={f('address')} />
        <textarea className="border rounded px-3 py-2 w-full" placeholder="Notes (optional)" value={form.notes} onChange={f('notes')} />
        <button disabled={busy} className="px-3 py-2 rounded bg-black text-white disabled:opacity-60">
          {busy ? 'Saving…' : 'Create Pilot'}
        </button>
      </form>
      {err && <div className="mt-3 text-red-600">{err}</div>}
    </div>
  );
}
