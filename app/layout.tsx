import './globals.css';
import type { ReactNode } from 'react';
import SiteHeader from './_components/SiteHeader';

export const metadata = { title: 'CWA Ride Event Scheduler' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-black">
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
