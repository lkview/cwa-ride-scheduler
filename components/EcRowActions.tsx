'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function EcRowActions({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);

  const onDelete = async () => {
    if (!confirm('Delete this emergency contact?')) return;
    setBusy(true);
    const res = await fetch(`/api/emergency-contacts/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(`Delete failed: ${j.error ?? res.statusText}`);
    } else {
      // simplest refresh
      location.reload();
    }
    setBusy(false);
  };

  return (
    <div className="flex gap-3">
      {/* If you don’t have an edit page yet, this link can come later */}
      <Link href={`/emergency-contacts/${id}/edit`} className="underline text-blue-700">
        Edit
      </Link>
      <button
        onClick={onDelete}
        disabled={busy}
        className="underline text-red-700 disabled:opacity-50"
      >
        {busy ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  );
}
