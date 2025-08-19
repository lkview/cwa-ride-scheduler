import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServerUserClient } from '@/lib/serverUserClient';

// Narrow the second arg without using a literal type that Next rejects
function getId(ctx: unknown): string {
  const id = (ctx as { params?: { id?: string } })?.params?.id;
  if (typeof id !== 'string' || id.length === 0) throw new Error('Missing route param "id"');
  return id;
}

export async function PATCH(req: NextRequest, ctx: unknown) {
  const id = getId(ctx);
  try {
    const body = await req.json();
    const allowed = new Set(['name', 'phone', 'email', 'notes']);
    const updates: Record<string, any> = {};
    for (const [k, v] of Object.entries(body ?? {})) {
      if (allowed.has(k)) updates[k] = v === '' ? null : v;
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
    }

    const supabase = await createServerUserClient(req);
    const { data, error } = await supabase
      .from('emergency_contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unexpected error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: unknown) {
  const id = getId(ctx);
  try {
    const supabase = await createServerUserClient(req);
    const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unexpected error' }, { status: 500 });
  }
}
