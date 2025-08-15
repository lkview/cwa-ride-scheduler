import { NextResponse } from 'next/server';
import { admin } from '../../_lib/supabaseAdmin';

export async function PATCH(req: Request, { params }: { params: { id: string }}) {
  const id = params.id;
  const body = await req.json();
  const { error } = await admin.from('ride_events').update(body).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
