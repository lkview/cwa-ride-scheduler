// app/emergency-contacts/page.tsx
import Link from 'next/link';
import { adminClient } from '@/lib/db';
import { deleteEntity } from '@/actions/deleteEntity';
import ConfirmDeleteButton from '@/components/ConfirmDeleteButton';
import { formatUSPhoneDisplay } from '@/lib/phone';

export const dynamic = 'force-dynamic';

type Contact = {
  id: string;
  name: string | null;
  phone: string | null;  // nullable in DB
  email: string | null;
  notes: string | null;
  hidden?: boolean | null;
};

async function listContacts(): Promise<Contact[]> {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('id, name, phone, email, notes, hidden')
    .eq('hidden', false)
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export default async function EmergencyContactsPage() {
  const rows = await listContacts();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1>Emergency Contacts</h1>
        <Link href="/emergency-contacts/new">New</Link>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Name</th>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Phone</th>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Email</th>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Notes</th>
            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{r.name}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                {formatUSPhoneDisplay(r.phone ?? '')}
              </td>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{r.email}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{r.notes}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                <Link href={`/emergency-contacts/${r.id}/edit`} style={{ marginRight: 12 }}>
                  Edit
                </Link>
                <ConfirmDeleteButton
                  table="emergency_contacts"
                  id={r.id}
                  refTable="ride_events"
                  refColumn="emergency_contact_id"
                  softField="hidden"
                  softValue={true}
                  redirectPath="/emergency-contacts"
                  label="Delete"
                  confirmTitle={`Delete ${r.name ?? 'this contact'}?`}
                  confirmBody="If used on any ride, they’ll be archived and hidden here. If not used, they’ll be deleted permanently."
                  action={deleteEntity}
                  style={{ color: '#b00020' }}
                />
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: '16px', color: '#666' }}>
                No contacts yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
