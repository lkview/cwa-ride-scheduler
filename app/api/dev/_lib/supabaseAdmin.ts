import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'dev';

export const admin = createClient(url, key, { db: { schema } });
