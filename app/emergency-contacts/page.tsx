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

// --- Supabase config (server-only) ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public';

// Read the table on the server (bypasses RLS with service role)
async function loadEmergencyContacts(): Promise<EmergencyContact[]> {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data, error } = await supabase
    .schema(SCHEMA)
    .from('emergency_contacts')
    .select('id, name, phone, email, notes')
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as EmergencyContact[];
}

export default async function EmergencyContactsPage() {
  // Server Action lives INSIDE the page (so it's not an exported symbol)
  async function deleteEmergencyContact(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    if (!id) return;

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    await supabase.schema(SCHEMA).from('emergency_contacts').delete().eq('id', id);

    // refresh this listing after deletion
    revalidatePath('/emergency-contacts');
  }

  let rows: EmergencyContact[] = [];
  try {
    rows = await loadEmergencyContacts();
  } catch (e: any) {
    return (
      <div style={{ color: 'red' }}>
        Error loading emergency contacts: {e?.message ?? 'Unknown error'}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Emergency Contacts</h1>
        <Link href="/emergency-contacts/new">New Emergency Contact</Link>
      </div>

      <div style={{ marginTop: 12, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Name</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Phone</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Email</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Notes</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{r.name}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{r.phone}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{r.email}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{r.notes}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Link href={`/emergency-contacts/${r.id}/edit`}>Edit</Link>
                    <form action={deleteEmergencyContact}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit">Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 16, textAlign: 'center', color: '#666' }}>
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
