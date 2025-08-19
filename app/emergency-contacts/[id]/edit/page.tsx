// app/emergency-contacts/[id]/edit/page.tsx
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public';

async function loadContact(id: string) {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data, error } = await supabase
    .schema(SCHEMA)
    .from('emergency_contacts')
    .select('id, name, phone, email, notes')
    .eq('id', id)
    .single();
  if (error?.code === 'PGRST116') return null; // no rows
  if (error) throw new Error(error.message);
  return data;
}

export default async function EditEmergencyContactPage({ params }: Params) {
  const row = await loadContact(params.id);
  if (!row) notFound();

  async function updateContact(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    const name = String(formData.get('name') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const email = (String(formData.get('email') ?? '').trim() || null) as string | null;
    const notes = (String(formData.get('notes') ?? '').trim() || null) as string | null;

    if (!id || !name || !phone) throw new Error('Missing required fields');

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { error } = await supabase
      .schema(SCHEMA)
      .from('emergency_contacts')
      .update({ name, phone, email, notes })
      .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath('/emergency-contacts');
    redirect('/emergency-contacts');
  }

  return (
    <div>
      <h1>Edit Emergency Contact</h1>
      <form action={updateContact} style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
        <input type="hidden" name="id" defaultValue={row.id} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input name="name" defaultValue={row.name ?? ''} required />
          <input name="phone" defaultValue={row.phone ?? ''} required />
        </div>
        <input name="email" defaultValue={row.email ?? ''} />
        <textarea name="notes" defaultValue={row.notes ?? ''} rows={4} />
        <div>
          <button type="submit">Save Changes</button>
        </div>
      </form>
    </div>
  );
}
