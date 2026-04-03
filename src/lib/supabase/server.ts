import { createClient } from "@supabase/supabase-js";

import { getSupabaseBrowserEnv, getSupabaseServerEnv } from "@/lib/env";

export function createServerSupabaseClient() {
  const { url, anonKey } = getSupabaseBrowserEnv();

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createAdminSupabaseClient() {
  const { url, serviceRoleKey } = getSupabaseServerEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
