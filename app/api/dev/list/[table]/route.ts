import { NextResponse } from 'next/server';
import { admin } from '../../_lib/supabaseAdmin';

const ALLOWED = new Set(['pilots','passengers','pickup_locations','emergency_contacts','ride_events','profiles']);

export async function GET(req: Request, context: any) {
  const table = String(context?.params?.table || '');
  if (!ALLOWED.has(table)) return NextResponse.json({ error: 'Not allowed' }, { status: 400 });
  const { data, error } = await admin.from(table).select('*').limit(1000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
