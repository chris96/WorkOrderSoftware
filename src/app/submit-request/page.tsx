import { createAdminSupabaseClient } from "@/lib/supabase/server";

import { SubmitRequestForm } from "./submit-request-form";

export default async function SubmitRequestPage() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("units")
    .select("unit_number")
    .order("unit_number", { ascending: true });

  const unitOptions = error ? [] : (data ?? []).map((unit) => unit.unit_number);

  return <SubmitRequestForm unitOptions={unitOptions} />;
}
