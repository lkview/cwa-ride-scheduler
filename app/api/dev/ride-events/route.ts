import { NextResponse } from 'next/server';
import { admin } from '../_lib/supabaseAdmin';

export async function POST(req: Request) {
  const body = await req.json();
  const { error } = await admin.from('ride_events').insert(body);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
