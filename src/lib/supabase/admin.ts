import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Service-role klient — bypassuje RLS. UŻYWAJ TYLKO server-side, w:
 *  - Server Actions z dodatkową walidacją autoryzacji
 *  - API routes z CRON_SECRET / podobnym
 *  - Adminowych operacjach
 *
 * NIGDY nie eksponuj tego klienta w żaden Client Component ani API publiczne.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Brak SUPABASE_SERVICE_ROLE_KEY — uzupełnij w .env.local (Supabase → Settings → API → Secret keys).",
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
