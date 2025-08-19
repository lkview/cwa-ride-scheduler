// app/emergency-contacts/page.tsx

import Link from 'next/link';
import EcRowActions from '@/components/EcRowActions';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

type EmergencyContact = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

// Minimal Supabase client for Server Components (reads cookies only)
async function createServerPageClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // No-ops for Server Component reads
        set() {},
        remove() {},
      },
    }
  );
}

export default async function EmergencyContactsPage() {
  const supabase = await createServerPageClient();
  const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public';

  const { data: rows, error } = await supabase
    .schema(schema)
    .from('emergency_contacts')
    .select<`${'id' | 'name' | 'phone' | 'email' | 'notes'}`>('id, name, phone, email, notes')
    .order('name');

  if (error) {
    return (
      <div className="text-red-700">
        Error loading emergency contacts: {error.message}
      </div>
    );
  }

  const data = (rows ?? []) as EmergencyContact[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Emergency Contacts</h1>
        <Link
          href="/emergency-contacts/new"
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          New Emergency Contact
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left border-b">Name</th>
              <th className="px-3 py-2 text-left border-b">Phone</th>
              <th className="px-3 py-2 text-left border-b">Email</th>
              <th className="px-3 py-2 text-left border-b">Notes</th>
              <th className="px-3 py-2 text-left border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                <td className="px-3 py-2 border-b">{r.name}</td>
                <td className="px-3 py-2 border-b">{r.phone}</td>
                <td className="px-3 py-2 border-b">{r.email}</td>
                <td className="px-3 py-2 border-b">{r.notes}</td>
                <td className="px-3 py-2 border-b">
                  <EcRowActions id={r.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
