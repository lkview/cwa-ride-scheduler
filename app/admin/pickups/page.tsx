'use client';

import { useEffect, useState } from 'react';

type Pickup = {
  id: string;
  name: string;
  address: string;
  notes: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  updated_at: string;
};

export default function AdminPickupsPage() {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [schemaUsed, setSchemaUsed] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pickups/list', { cache: 'no-store' });
      const json = await res.json();
      setPickups(json?.pickups || []);
      setSchemaUsed(json?.schemaUsed || '');
      if (json?.error) setError(json.error);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onSave() {
    setSaving(true);
    setFormErr(null);
    try {
      const res = await fetch('/api/pickups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, address: form.address, notes: form.notes || null }),
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setFormErr(json?.error || 'Save failed');
      } else {
        setModalOpen(false);
        setForm({ name: '', address: '', notes: '' });
        await load();
      }
    } catch (e: any) {
      setFormErr(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '2rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Pickup Locations</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/admin/pickups-debug" style={{ padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid #ccc', textDecoration: 'none' }}>Open Debug View</a>
          <button onClick={() => setModalOpen(true)} style={{ padding: '0.6rem 1rem', background: 'black', color: 'white', borderRadius: 8 }}>New pickup</button>
        </div>
      </div>

      <div style={{ marginTop: 8, background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8, padding: 10 }}>
        <b>Debug:</b> schemaUsed = <code>{schemaUsed || '(unknown)'}</code>, count = <b>{pickups.length}</b>
        {error && (<span style={{ color: 'crimson' }}>&nbsp; error: {error}</span>)}
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div style={{ marginTop: '1rem', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#fafafa' }}>
              <tr>
                <th style={th}>Name</th>
                <th style={th}>Address</th>
                <th style={th}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {pickups.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>No pickup locations.</td></tr>
              ) : (
                pickups.map(p => (
                  <tr key={p.id} style={{ borderTop: '1px solid #eee' }}>
                    <td style={td}>{p.name}</td>
                    <td style={td}>{p.address}</td>
                    <td style={td}>{p.notes || ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div style={modalBackdrop}>
          <div style={modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>New pickup</h3>
              <button onClick={() => setModalOpen(false)} style={{ fontSize: 20, lineHeight: 1, background: 'transparent', border: 'none' }}>×</button>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={label}>Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={input} />
              <label style={label}>Address</label>
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={input} />
              <label style={label}>Notes (optional)</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...input, minHeight: 90 }} />
              {formErr && <div style={{ color: 'crimson', marginTop: 8 }}>{formErr}</div>}
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setModalOpen(false)} style={{ ...btn, background: '#eee' }}>Cancel</button>
              <button onClick={onSave} disabled={saving} style={{ ...btn, background: 'black', color: 'white' }}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { textAlign: 'left', padding: '0.8rem', fontWeight: 600, fontSize: 14, color: '#333' };
const td: React.CSSProperties = { padding: '0.8rem', fontSize: 14 };
const btn: React.CSSProperties = { padding: '0.4rem 0.7rem', borderRadius: 6, border: '1px solid #ccc', background: 'white' };
const label: React.CSSProperties = { display: 'block', fontSize: 13, color: '#333', marginTop: 8, marginBottom: 4 };
const input: React.CSSProperties = { width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: 14 };

const modalBackdrop: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
};
const modalCard: React.CSSProperties = {
  background: 'white', borderRadius: 12, padding: 16, minWidth: 420, maxWidth: 600, boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
};
