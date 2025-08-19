// app/emergency-contacts/[id]/edit/page.tsx
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { formatUSPhone } from '@/lib/phone';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SCHEMA       = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public';

async function loadContact(id: string) {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { db: { schema: SCHEMA } });
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('id,name,phone,email,notes')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export default async function EditPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const row = await loadContact(params.id).catch(() => null);
  if (!row) notFound();

  const err =
    typeof searchParams?.error === 'string' ? decodeURIComponent(searchParams.error) : null;

  async function updateContact(formData: FormData) {
    'use server';
    const id    = String(formData.get('id') ?? '');
    const name  = String(formData.get('name') ?? '').trim();
    const raw   = String(formData.get('phone') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const notes = String(formData.get('notes') ?? '').trim();

    try {
      if (!id || !name || !raw) throw new Error('Name and phone are required.');
      // Validate + normalize (throws on invalid)
      const phone = formatUSPhone(raw);

      const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { db: { schema: SCHEMA } });
      const { error } = await supabase
        .from('emergency_contacts')
        .update({
          name,
          phone, // "(XXX) XXX-XXXX"
          email: email || null,
          notes: notes || null,
        })
        .eq('id', id);

      if (error) throw new Error(error.message);

      revalidatePath('/emergency-contacts');
      redirect('/emergency-contacts?m=updated');
    } catch (e: any) {
      const msg =
        e?.message === 'Invalid US phone number'
          ? 'Please enter a valid 10-digit US phone number.'
          : e?.message || 'Update failed.';
      redirect(`/emergency-contacts/${encodeURIComponent(id)}/edit?error=${encodeURIComponent(msg)}`);
    }
  }

  return (
    <div className="space-y-6">
      <h1>Edit Emergency Contact</h1>

      {err && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {err}
        </div>
      )}

      <form action={updateContact} className="space-y-4 max-w-xl">
        <input type="hidden" name="id" value={row.id} />

        <div>
          <label className="block text-sm font-medium">Name *</label>
          <input
            name="name"
            defaultValue={row.name ?? ''}
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Phone *</label>
          <input
            name="phone"
            defaultValue={row.phone ?? ''}
            placeholder="e.g. 509-555-1214"
            inputMode="numeric"
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
          <p className="mt-1 text-xs text-gray-500">10 digits required. We’ll format it.</p>
        </div>

        <div>
          <label className="block text-sm font-medium">Email (optional)</label>
          <input
            name="email"
            defaultValue={row.email ?? ''}
            type="email"
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Notes (optional)</label>
          <textarea
            name="notes"
            defaultValue={row.notes ?? ''}
            rows={3}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white hover:opacity-90"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
