// app/emergency-contacts/page.tsx

import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

type EmergencyContact = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

// ---- Supabase config (reads public + service keys from env) ----
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public';

// Read rows for the table (anon key is fine for read in Preview; switch to service role if your RLS blocks it)
async function fetchEmergencyContacts(): Promise<EmergencyContact[]> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { 'X-Client-Info': 'cwa-rsc' } },
  });

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from('emergency_contacts')
    .select('id, name, phone, email, notes')
    .order('name');

  if (error) throw new Error(error.message);
  return (data ?? []) as EmergencyContact[];
}

// Server Action: delete a row, then revalidate this page
export async function deleteEmergencyContact(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { 'X-Service-Action': 'delete-ec' } },
  });

  await supabase.schema(SCHEMA).from('emergency_contacts').delete().eq('id', id);

  // Refresh the table after deletion
  revalidatePath('/emergency-contacts');
}

export default async function EmergencyContactsPage() {
  let rows: EmergencyContact[] = [];
  try {
    rows = await fetchEmergencyContacts();
  } catch (e: any) {
    return (
      <div className="text-red-700">
        Error loading emergency contacts: {e?.message ?? 'Unknown error'}
      </div>
    );
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
            {rows.map((r) => (
              <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                <td className="px-3 py-2 border-b">{r.name}</td>
                <td className="px-3 py-2 border-b">{r.phone}</td>
                <td className="px-3 py-2 border-b">{r.email}</td>
                <td className="px-3 py-2 border-b">{r.notes}</td>
                <td className="px-3 py-2 border-b">
                  <div className="flex items-center gap-3">
                    {/* Edit page is optional; add when ready */}
                    <Link href={`/emergency-contacts/${r.id}/edit`} className="underline text-blue-700">
                      Edit
                    </Link>

                    <form action={deleteEmergencyContact}>
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        className="underline text-red-700"
                        onClick={(e) => {
                          if (!confirm('Delete this emergency contact?')) e.preventDefault();
                        }}
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                  No emergency contacts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
