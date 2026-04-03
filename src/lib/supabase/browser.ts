import { createClient } from "@supabase/supabase-js";

import { getSupabaseBrowserEnv } from "@/lib/env";

export function createBrowserSupabaseClient() {
  const { url, anonKey } = getSupabaseBrowserEnv();

  return createClient(url, anonKey);
}
