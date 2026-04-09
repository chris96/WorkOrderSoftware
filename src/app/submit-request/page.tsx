import { getUnitOptions } from "@/lib/units";

import { SubmitRequestForm } from "./submit-request-form";

export const revalidate = 3600;

export default async function SubmitRequestPage() {
  const unitOptions = await getUnitOptions();

  return <SubmitRequestForm unitOptions={unitOptions} />;
}
