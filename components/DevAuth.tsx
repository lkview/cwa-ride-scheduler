'use client';
import { useEffect, useState } from 'react';

const DEV = process.env.NEXT_PUBLIC_DEV_FAKE_AUTH === 'true';
type Role = 'admin'|'scheduler'|'pilot'|'viewer';

export function getDevRole(): Role {
  if (!DEV) return 'viewer';
  if (typeof window === 'undefined') return 'viewer';
  return (localStorage.getItem('devRole') as Role) || 'admin';
}

export default function DevAuth() {
  if (!DEV) return null;
  const [role, setRole] = useState<Role>('admin');

  useEffect(() => {
    const saved = (typeof window!=='undefined' && localStorage.getItem('devRole')) as Role | null;
    if (saved) setRole(saved);
  }, []);

  const change = (r: Role) => {
    setRole(r);
    if (typeof window!=='undefined') localStorage.setItem('devRole', r);
    // small flash ok
    if (typeof window!=='undefined') window.location.reload();
  };

  const Btn = ({r}:{r:Role}) => (
    <label className="inline-flex items-center gap-1 mr-3 cursor-pointer">
      <input type="radio" name="devrole" value={r} checked={role===r} onChange={()=>change(r)} />
      <span className="text-sm">{r}</span>
    </label>
  );

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-3 py-2 text-sm text-yellow-900">
      <span className="font-semibold mr-2">DEV MODE:</span>
      <Btn r="admin" />
      <Btn r="scheduler" />
      <Btn r="pilot" />
      <Btn r="viewer" />
      <span className="ml-3 text-xs text-yellow-700">(bypasses Supabase login; uses server API)</span>
    </div>
  );
}
