// app/page.tsx
import AuthGate from '../components/AuthGate';
import Link from 'next/link';

export default function Home() {
  return (
    <AuthGate>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Read-only directories</h1>
        <ul className="list-disc pl-6 space-y-1">
          <li><Link className="underline" href="/pilots">Pilots</Link></li>
          <li><Link className="underline" href="/passengers">Passengers</Link></li>
          <li><Link className="underline" href="/pickup-locations">Pickup Locations</Link></li>
          <li><Link className="underline" href="/emergency-contacts">Emergency Contacts</Link></li>
          <li><Link className="underline" href="/ride-events">Ride Events</Link></li>
        </ul>
      </div>
    </AuthGate>
  );
}
