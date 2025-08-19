// app/emergency-contacts/[id]/edit/page.tsx
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public';

function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    db: { schema: SCHEMA },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function loadContact(id: string) {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('id, name, phone, email, notes')
    .eq('id', id)
    .single();

  if (error) {
    // Surface 404 for missing rows; bubble others
    if (error.code === 'PGRST116' || error.details?.includes('Results contain 0 rows'))
      return null;
    throw error;
  }
  return data;
}

type PageProps = { params: Promise<{ id: string }> };

export default async function EditEmergencyContactPage({ params }: PageProps) {
  const { id } = await params;

  const row = await loadContact(id);
  if (!row) notFound();

  async function updateContact(formData: FormData) {
    'use server';

    const name = String(formData.get('name') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const email = (String(formData.get('email') ?? '').trim() || null) as string | null;
    const notes = (String(formData.get('notes') ?? '').trim() || null) as string | null;

    if (!name || !phone) {
      throw new Error('Name and phone are required.');
    }

    const supabase = adminClient();
    const { error } = await supabase
      .from('emergency_contacts')
      .update({ name, phone, email, notes })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/emergency-contacts');
    redirect('/emergency-contacts');
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h1>Edit Emergency Contact</h1>

      <form action={updateContact} style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <label htmlFor="name">Name *</label>
          <input id="name" name="name" defaultValue={row.name ?? ''} required />
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <label htmlFor="phone">Phone *</label>
          <input id="phone" name="phone" defaultValue={row.phone ?? ''} required />
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <label htmlFor="email">Email (optional)</label>
          <input id="email" name="email" defaultValue={row.email ?? ''} />
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <label htmlFor="notes">Notes (optional)</label>
          <textarea id="notes" name="notes" defaultValue={row.notes ?? ''} />
        </div>

        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}
