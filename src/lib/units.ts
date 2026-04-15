import { unstable_cache } from "next/cache";

import { createAdminSupabaseClient } from "@/lib/supabase/server";

const getCachedUnitOptions = unstable_cache(
  async () => {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("units")
      .select("unit_number")
      .order("unit_number", { ascending: true });

    if (error) {
      throw new Error("Unit options could not be loaded.");
    }

    return (data ?? []).map((unit) => unit.unit_number);
  },
  ["tenant-unit-options"],
  {
    revalidate: 60 * 60,
  }
);

export async function getUnitOptions() {
  return getCachedUnitOptions();
}
