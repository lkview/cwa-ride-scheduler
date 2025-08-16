import { NextResponse } from 'next/server';
import { admin } from '../_lib/supabaseAdmin';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const time = searchParams.get('time');
  const pilot = searchParams.get('pilot');
  const p1 = searchParams.get('p1');
  const p2 = searchParams.get('p2');
  const exclude = searchParams.get('exclude');
  if (!date || !time) return NextResponse.json({ error: 'date and time required' }, { status: 400 });
  const mt = time.length === 5 ? time + ':00' : time;

  const neq = exclude ? { column: 'id', value: exclude } : null;

  // Avoid deep generic instantiation by casting the query builder to any.
  const fromRideEvents: any = (admin as any).from('ride_events');

  const q = (col: string, val: string) => {
    let query: any = fromRideEvents
      .select('id')
      .eq('date', date)
      .eq('meeting_time', mt)
      .eq(col as any, val)
      .limit(1);
    if (neq) query = query.neq(neq.column as any, neq.value as any);
    return query;
  };

  const checks: Array<Promise<any>> = [];
  if (pilot) checks.push(q('pilot_id', pilot));
  if (p1) checks.push(q('passenger1_id', p1));
  if (p2) checks.push(q('passenger1_id', p2));
  if (p1) checks.push(q('passenger2_id', p1));
  if (p2) checks.push(q('passenger2_id', p2));

  const results = await Promise.all(checks);
  const any = results.some((r: any) => r.error || (r.data && r.data.length));
  const errors = results.filter((r: any) => r.error).map((r: any) => r.error.message);
  return NextResponse.json({ ok: !any, errors });
}
