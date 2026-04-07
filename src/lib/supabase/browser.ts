import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseBrowserEnv } from "@/lib/env";

export function createBrowserSupabaseClient() {
  const { url, anonKey } = getSupabaseBrowserEnv();

  return createBrowserClient(url, anonKey);
}
