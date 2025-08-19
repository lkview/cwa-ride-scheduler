// app/emergency-contacts/new/page.tsx
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public';

export default function NewEmergencyContactPage() {
  async function createContact(formData: FormData) {
    'use server';
    const name = String(formData.get('name') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const email = (String(formData.get('email') ?? '').trim() || null) as string | null;
    const notes = (String(formData.get('notes') ?? '').trim() || null) as string | null;

    if (!name || !phone) {
      throw new Error('Name and Phone are required');
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { error } = await supabase
      .schema(SCHEMA)
      .from('emergency_contacts')
      .insert({ name, phone, email, notes });

    if (error) throw new Error(error.message);

    revalidatePath('/emergency-contacts');
    redirect('/emergency-contacts');
  }

  return (
    <div>
      <h1>New Emergency Contact</h1>
      <form action={createContact} style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input name="name" placeholder="Name" required />
          <input name="phone" placeholder="Phone" required />
        </div>
        <input name="email" placeholder="Email (optional)" />
        <textarea name="notes" placeholder="Notes (optional)" rows={4} />
        <div>
          <button type="submit">Create Contact</button>
        </div>
      </form>
    </div>
  );
}
