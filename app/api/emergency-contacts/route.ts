// app/api/emergency-contacts/route.ts
import { NextResponse } from 'next/server';
import { createServerUserClient } from '@/lib/serverUserClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, email = null, notes = null } = body || {};
    if (!name || !phone) {
      return NextResponse.json({ error: 'name and phone are required.' }, { status: 400 });
    }

    const supabase = await createServerUserClient(req); // forward user token if present

    const { data, error } = await supabase
      .from('emergency_contacts')
      .insert([{ name, phone, email, notes }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unexpected error' }, { status: 500 });
  }
}
