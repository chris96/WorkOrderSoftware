import { getUnitOptions } from "@/lib/units";

import { SubmitRequestForm } from "./submit-request-form";

export const revalidate = 3600;

export default async function SubmitRequestPage() {
  let unitOptions: string[] = [];

  try {
    unitOptions = await getUnitOptions();
  } catch {
    unitOptions = [];
  }

  return <SubmitRequestForm unitOptions={unitOptions} />;
}
