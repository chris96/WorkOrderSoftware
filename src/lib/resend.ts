import { Resend } from "resend";

import { getEmailEnv } from "@/lib/env";

export function createResendClient() {
  const { resendApiKey } = getEmailEnv();
  return new Resend(resendApiKey);
}
