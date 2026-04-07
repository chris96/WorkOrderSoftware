import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { getSupabaseBrowserEnv, getSupabaseServerEnv } from "@/lib/env";

export async function createServerSupabaseClient() {
  const { url, anonKey } = getSupabaseBrowserEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components can read auth cookies but cannot always write them.
        }
      },
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
