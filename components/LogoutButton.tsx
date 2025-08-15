'use client';

import { supabase } from '../lib/supabaseClient';

export default function LogoutButton() {
  return (
    <button
      onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}
      className="px-3 py-1 rounded border hover:bg-gray-50"
      aria-label="Sign out"
    >
      Sign out
    </button>
  );
}
