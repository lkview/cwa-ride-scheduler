
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPickupLocationPage() {
  const r = useRouter();
  const [form, setForm] = useState({ name:'', address:'', notes:'', lat:'', lng:'' });
  const [err, setErr] = useState<string|null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const payload: any = { name: form.name, address: form.address, notes: form.notes || null };
      if (form.lat) payload.lat = Number(form.lat);
      if (form.lng) payload.lng = Number(form.lng);

      const res = await fetch('/api/pickup-locations', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create');
      r.push('/pickup-locations');
    } catch (e:any) { setErr(e.message); } finally { setBusy(false); }
  }
  function f<K extends keyof typeof form>(k:K){return(e:any)=>setForm(s=>({...s,[k]:e.target.value}));}

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">New Pickup Location</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="border rounded px-3 py-2 w-full" placeholder="Name" value={form.name} onChange={f('name')} required />
        <input className="border rounded px-3 py-2 w-full" placeholder="Address" value={form.address} onChange={f('address')} required />
        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Latitude (optional)" value={form.lat} onChange={f('lat')} />
          <input className="border rounded px-3 py-2" placeholder="Longitude (optional)" value={form.lng} onChange={f('lng')} />
        </div>
        <textarea className="border rounded px-3 py-2 w-full" placeholder="Notes (optional)" value={form.notes} onChange={f('notes')} />
        <button disabled={busy} className="px-3 py-2 rounded bg-black text-white disabled:opacity-60">
          {busy ? 'Saving…' : 'Create Location'}
        </button>
      </form>
      {err && <div className="mt-3 text-red-600">{err}</div>}
    </div>
  );
}
