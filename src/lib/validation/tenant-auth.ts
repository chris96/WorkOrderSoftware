import { z } from "zod";

export const tenantMagicLinkSchema = z.object({
  email: z.email("Please enter a valid email address."),
});

export type TenantMagicLinkValues = z.infer<typeof tenantMagicLinkSchema>;
