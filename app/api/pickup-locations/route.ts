
import { NextResponse } from 'next/server';
import { createServerUserClient } from '@/lib/serverUserClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, address, notes = null, lat = null, lng = null } = body || {};

    if (!name || !address) {
      return NextResponse.json({ error: 'name and address are required.' }, { status: 400 });
    }

    const supabase = createServerUserClient();
    const { data, error } = await supabase
      .from('pickup_locations')
      .insert([{ name, address, notes, lat, lng }])
      .select()
      .single();

    if (error) {
      const msg = (error as any).code === '23505' ? 'A pickup location with that name+address already exists.' : error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unexpected error' }, { status: 500 });
  }
}
