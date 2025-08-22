// app/_components/SiteHeader.tsx
'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function SiteHeader() {
  const supabase = useMemo(() => {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }, []);

  const onSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-6 p-4">
        <Link href="/" className="font-semibold">CWA Ride Event Scheduler</Link>
        <nav className="flex items-center gap-4">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/admin/people" className="hover:underline">People</Link>
        </nav>
        <button onClick={onSignOut} className="ml-auto rounded border px-3 py-1 text-sm">Sign out</button>
      </div>
    </header>
  );
}
