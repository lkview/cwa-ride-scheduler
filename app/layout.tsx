// app/layout.tsx
import './globals.css';
import Link from 'next/link';
import LogoutButton from '../components/LogoutButton';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'CWA Ride Event Scheduler';
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <nav className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap gap-4 items-center">
            <span className="font-semibold">{appName}</span>
            <Link className="hover:underline" href="/">Home</Link>
            <Link className="hover:underline" href="/pilots">Pilots</Link>
            <Link className="hover:underline" href="/passengers">Passengers</Link>
            <Link className="hover:underline" href="/pickup-locations">Pickup Locations</Link>
            <Link className="hover:underline" href="/emergency-contacts">Emergency Contacts</Link>
            <Link className="hover:underline" href="/ride-events">Ride Events</Link>
            <span className="ml-auto"><LogoutButton /></span>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl p-4">{children}</main>
      </body>
    </html>
  );
}
