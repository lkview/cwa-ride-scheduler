'use client';
import { useEffect } from 'react';

/**
 * Universal Supabase auth callback.
 * This page runs on the PRODUCTION domain and forwards the magic-link hash
 * to the requested `next` URL (e.g., a Preview), preserving the tokens.
 */
export default function AuthCallback() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next') || '/';
      const hash = window.location.hash || '';
      // Forward the full hash to the target (preview) so that client can set the session there.
      if (next.startsWith('http')) {
        window.location.replace(next + hash);
      } else {
        window.location.replace(String(next) + hash);
      }
    } catch {
      // If anything goes wrong, just go home.
      window.location.replace('/');
    }
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-2">Signing you in…</h1>
      <p className="text-sm text-gray-600">Please wait.</p>
    </div>
  );
}
