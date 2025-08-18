
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewEmergencyContactPage() {
  const r = useRouter();
  const [form, setForm] = useState({ name:'', phone:'', email:'', notes:'' });
  const [err, setErr] = useState<string|null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const res = await fetch('/api/emergency-contacts', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create');
      r.push('/emergency-contacts');
    } catch (e:any) { setErr(e.message); } finally { setBusy(false); }
  }
  function f<K extends keyof typeof form>(k:K){return(e:any)=>setForm(s=>({...s,[k]:e.target.value}));}

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">New Emergency Contact</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Name" value={form.name} onChange={f('name')} required />
          <input className="border rounded px-3 py-2" placeholder="Phone" value={form.phone} onChange={f('phone')} required />
        </div>
        <input className="border rounded px-3 py-2 w-full" type="email" placeholder="Email (optional)" value={form.email} onChange={f('email')} />
        <textarea className="border rounded px-3 py-2 w-full" placeholder="Notes (optional)" value={form.notes} onChange={f('notes')} />
        <button disabled={busy} className="px-3 py-2 rounded bg-black text-white disabled:opacity-60">
          {busy ? 'Saving…' : 'Create Contact'}
        </button>
      </form>
      {err && <div className="mt-3 text-red-600">{err}</div>}
    </div>
  );
}
