// app/layout.tsx
import './globals.css';
import SiteHeader from './_components/SiteHeader';

export const metadata = {
  title: 'CWA Ride Event Scheduler',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <SiteHeader />
        <main className="mx-auto max-w-6xl p-6">{children}</main>
      </body>
    </html>
  );
}
