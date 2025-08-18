
import { NextResponse } from 'next/server';
import { createServerUserClient } from '@/lib/serverUserClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { first_name, last_name, phone, email, address = null, notes = null } = body || {};

    if (!first_name || !last_name || !phone || !email) {
      return NextResponse.json({ error: 'first_name, last_name, phone, email are required.' }, { status: 400 });
    }

    const supabase = await createServerUserClient();
    const { data, error } = await supabase
      .from('pilots')
      .insert([{ first_name, last_name, phone, email, address, notes }])
      .select()
      .single();

    if (error) {
      const msg = (error as any).code === '23505' ? 'A pilot with that email already exists.' : error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unexpected error' }, { status: 500 });
  }
}
