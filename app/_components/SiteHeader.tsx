'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function SiteHeader() {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);
  const linkClass = (href: string) =>
    `px-3 py-2 rounded-md text-sm font-medium ${pathname === href ? 'bg-black text-white' : 'text-black hover:bg-zinc-100'}`;

  const onSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header className="w-full border-b border-zinc-200">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-semibold">CWA Ride Event Scheduler</Link>
          <nav className="ml-6 flex items-center gap-2">
            <Link href="/" className={linkClass('/')}>Home</Link>
            <Link href="/admin/people" className={linkClass('/admin/people')}>People</Link>
            <Link href="/admin/pickups" className={linkClass('/admin/pickups')}>Pickup Locations</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onSignOut} className="px-3 py-2 rounded-md border border-zinc-300 hover:bg-zinc-100 text-sm">Sign out</button>
        </div>
      </div>
    </header>
  );
}
