// actions/deleteEntity.ts
'use server';

import { revalidatePath } from 'next/cache';
import { adminClient } from '@/lib/db';

/**
 * Generic delete action:
 * - If refTable/refColumn provided and reference exists -> soft delete (update softField=softValue)
 * - Else -> hard delete (delete row)
 * Revalidates redirectPath.
 *
 * Expects the following fields in FormData:
 *  - table (string, required)
 *  - id (string, required)
 *  - refTable (string, optional)
 *  - refColumn (string, optional)
 *  - softField (string, optional; required if refTable/refColumn provided)
 *  - softValue (string|boolean, optional; default 'true')
 *  - redirectPath (string, optional; default '/')
 */
export async function deleteEntity(formData: FormData) {
  const table = String(formData.get('table') ?? '');
  const id = String(formData.get('id') ?? '');
  const refTable = String(formData.get('refTable') ?? '');
  const refColumn = String(formData.get('refColumn') ?? '');
  const softField = String(formData.get('softField') ?? '');
  const softValueRaw = String(formData.get('softValue') ?? 'true');
  const redirectPath = String(formData.get('redirectPath') ?? '/');

  if (!table || !id) throw new Error('Missing table or id');

  const supabase = adminClient();

  let referenced = false;
  if (refTable && refColumn) {
    const { count, error: refErr } = await supabase
      .from(refTable)
      .select('id', { head: true, count: 'exact' })
      .eq(refColumn, id);
    if (refErr) throw refErr;
    referenced = (count ?? 0) > 0;
  }

  if (referenced && softField) {
    // Soft delete
    let softValue: any = softValueRaw;
    if (softValueRaw === 'true') softValue = true;
    else if (softValueRaw === 'false') softValue = false;

    const { error } = await supabase.from(table).update({ [softField]: softValue }).eq('id', id);
    if (error) throw error;
  } else {
    // Hard delete
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
  }

  revalidatePath(redirectPath);
}
