import { z } from "zod";

export const bootstrapStaffRoles = ["super", "backup"] as const;

const strongPasswordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;

export const staffBootstrapSchema = z.object({
  bootstrapKey: z
    .string()
    .trim()
    .min(1, "Enter the bootstrap key to authorize staff setup."),
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter the staff member's full name."),
  email: z.email("Please enter a valid staff email address."),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters long.")
    .refine(
      (value) => strongPasswordPattern.test(value),
      "Password must include uppercase, lowercase, and a number."
    ),
  role: z.enum(bootstrapStaffRoles, {
    error: "Please choose a valid staff role.",
  }),
});

export type StaffBootstrapValues = z.infer<typeof staffBootstrapSchema>;

export type StaffBootstrapFieldErrors = Partial<
  Record<keyof StaffBootstrapValues, string>
>;

export const initialStaffBootstrapValues: StaffBootstrapValues = {
  bootstrapKey: "",
  fullName: "",
  email: "",
  password: "",
  role: "super",
};
