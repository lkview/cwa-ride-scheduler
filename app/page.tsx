'use client';

import { useEffect, useState } from 'react';

type Pickup = { id: string; name: string; address: string; notes: string | null };

export default function HomePage() {
  const [open, setOpen] = useState(false);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [pickupId, setPickupId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch('/api/pickups/list', { cache: 'no-store' });
        const json = await res.json();
        setPickups(json?.pickups || []);
        if (json?.error) setErr(json.error);
      } catch (e: any) {
        setErr(e?.message || 'Failed to load pickups');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: '2rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Rides</h1>

      <div style={{ marginTop: 8, background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8, padding: 10 }}>
        <b>Debug:</b> pickup options loaded: <b>{pickups.length}</b>{err && <span style={{ color: 'crimson' }}>&nbsp;error: {err}</span>}
      </div>

      <div style={{ marginTop: 16 }}>
        <button onClick={() => setOpen(true)} style={{ padding: '0.6rem 1rem', background: 'black', color: 'white', borderRadius: 8 }}>
          New ride
        </button>
      </div>

      {open && (
        <div style={modalBackdrop}>
          <div style={modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>New ride</h3>
              <button onClick={() => setOpen(false)} style={{ fontSize: 20, lineHeight: 1, background: 'transparent', border: 'none' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              <div>
                <label style={label}>Date</label>
                <input type="date" style={input} />
              </div>
              <div>
                <label style={label}>Time</label>
                <select style={input}>
                  <option>Select time</option>
                  <option>8:00 AM</option>
                  <option>9:00 AM</option>
                  <option>10:00 AM</option>
                </select>
              </div>

              <div>
                <label style={label}>Pilot</label>
                <select style={input}><option>Select a pilot</option></select>
              </div>
              <div>
                <label style={label}>Emergency Contact</label>
                <select style={input}><option>Select emergency contact</option></select>
              </div>

              <div>
                <label style={label}>Passenger 1</label>
                <select style={input}><option>Select passenger</option></select>
              </div>
              <div>
                <label style={label}>Passenger 2 (optional)</label>
                <select style={input}><option>— None —</option></select>
              </div>

              <div style={{ gridColumn: '1 / span 2' }}>
                <label style={label}>Pickup location</label>
                <select
                  value={pickupId}
                  onChange={e => setPickupId(e.target.value)}
                  style={input}
                >
                  <option value="">Select pickup</option>
                  {pickups.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: '1 / span 2' }}>
                <label style={label}>Notes</label>
                <textarea style={{ ...input, minHeight: 120 }} />
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setOpen(false)} style={{ ...btn, background: '#eee' }}>Cancel</button>
              <button style={{ ...btn, background: 'black', color: 'white' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const label: React.CSSProperties = { display: 'block', fontSize: 13, color: '#333', marginBottom: 6 };
const input: React.CSSProperties = { width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: 14 };
const btn: React.CSSProperties = { padding: '0.5rem 0.9rem', borderRadius: 8, border: '1px solid #ccc' };

const modalBackdrop: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
};
const modalCard: React.CSSProperties = {
  background: 'white', borderRadius: 12, padding: 16, minWidth: 720, maxWidth: 900, boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
};
