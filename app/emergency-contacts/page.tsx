import Link from 'next/link';
import EcRowActions from '@/components/EcRowActions';
import { createServerClient } from '@/lib/serverClient'; // same helper you already use on list pages, adjust import if needed

export const dynamic = 'force-dynamic';

export default async function EmergencyContactsPage() {
  const supabase = await createServerClient();
  const { data: rows, error } = await supabase
    .from('emergency_contacts')
    .select('id, name, phone, email, notes')
    .order('name');

  if (error) {
    return <p className="text-red-700">Error: {error.message}</p>;
  }

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
            {(rows ?? []).map((r) => (
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
