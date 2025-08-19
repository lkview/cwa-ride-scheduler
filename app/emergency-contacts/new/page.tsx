// app/emergency-contacts/new/page.tsx
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { normalizeUSPhone } from '@/lib/phone';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public';

export default function NewEmergencyContactPage() {
  async function createContact(formData: FormData) {
    'use server';
    const name = String(formData.get('name') ?? '').trim();
    const phoneRaw = String(formData.get('phone') ?? '').trim();
    const email = (String(formData.get('email') ?? '').trim() || null) as string | null;
    const notes = (String(formData.get('notes') ?? '').trim() || null) as string | null;

    if (!name) throw new Error('Name is required.');

    const check = normalizeUSPhone(phoneRaw);
    if (!check.ok) {
      throw new Error(`Invalid phone number: ${check.reason}`);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { error } = await supabase
      .schema(SCHEMA)
      .from('emergency_contacts')
      .insert({ name, phone: check.e164, email, notes });

    if (error) throw new Error(error.message);

    revalidatePath('/emergency-contacts');
    redirect('/emergency-contacts');
  }

  return (
    <div>
      <h1>New Emergency Contact</h1>
      <form action={createContact} style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <label htmlFor="name">Name *</label>
            <input id="name" name="name" placeholder="e.g., Susan Garcia" required />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label htmlFor="phone">Phone *</label>
            <input
              id="phone"
              name="phone"
              placeholder="(555) 867-5309"
              inputMode="tel"
              autoComplete="tel"
              required
              pattern="^(\+?1[-.\s]?)?(\(?[2-9]\d{2}\)?)[-.\s]?\d{3}[-.\s]?\d{4}$"
              title="US phone number, 10 digits (area code 2-9)."
              maxLength={20}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor="email">Email (optional)</label>
          <input id="email" name="email" type="email" placeholder="name@example.com" />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor="notes">Notes (optional)</label>
          <textarea id="notes" name="notes" rows={4} />
        </div>

        <div>
          <button type="submit">Create Contact</button>
        </div>
      </form>
    </div>
  );
}
