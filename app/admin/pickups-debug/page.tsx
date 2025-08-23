'use client';

import { useEffect, useState } from 'react';

export default function PickupsDebugPage() {
  const [payload, setPayload] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const res = await fetch('/api/pickups/list', { cache: 'no-store' });
      const json = await res.json();
      setPayload(json);
    } catch (e: any) {
      setErr(e?.message || 'failed to load');
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Pickups Debug</h1>
      <p>This shows exactly what <code>/api/pickups/list</code> returns.</p>
      <button onClick={load} style={{ padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid #ccc' }}>Reload</button>
      {err && <pre style={{ color: 'crimson' }}>{err}</pre>}
      <pre style={{ background: '#f6f6f6', padding: '1rem', borderRadius: 8, marginTop: '1rem', overflowX: 'auto' }}>
        {JSON.stringify(payload, null, 2)}
      </pre>
      <p style={{ marginTop: 16 }}>
        Tip: if <code>schemaUsed</code> is <b>dev</b>, rows must exist in <code>dev.pickup_locations</code>.<br/>
        If pickups are empty but you know rows exist, caching is now disabled so try Reload.
      </p>
    </div>
  );
}
