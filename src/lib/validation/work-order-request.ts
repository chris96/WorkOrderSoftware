import { z } from "zod";

const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const workOrderCategories = [
  "Plumbing",
  "Electrical",
  "Heating",
  "Appliance",
  "General maintenance",
] as const;

const phonePattern =
  /^[+]?[(]?[0-9]{3}[)]?[-\s./0-9]*$/;

const workOrderRequestBaseSchema = z.object({
  unit: z.string().trim().min(1, "Please select your unit."),
  category: z.string().trim().min(1, "Please choose a maintenance category."),
  tenantName: z
    .string()
    .trim()
    .min(2, "Please enter your full name."),
  email: z.email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || phonePattern.test(value),
      "Please enter a valid phone number."
    ),
  description: z
    .string()
    .trim()
    .min(10, "Please include a few more details about the issue."),
  isEmergency: z.boolean(),
});

export const workOrderRequestDataSchema = workOrderRequestBaseSchema.extend({
  phone: z.string().trim(),
});

export const workOrderRequestSchema = workOrderRequestBaseSchema.extend({
  photos: z
    .array(z.instanceof(File))
    .max(5, "Please upload no more than 5 photos.")
    .refine(
      (files) =>
        files.every((file) => ACCEPTED_PHOTO_TYPES.includes(file.type)),
      "Photos must be JPG, PNG, or WEBP files."
    )
    .refine(
      (files) => files.every((file) => file.size <= MAX_PHOTO_SIZE_BYTES),
      "Each photo must be 10 MB or smaller."
    ),
});

export type WorkOrderRequestValues = z.infer<typeof workOrderRequestSchema>;
export type WorkOrderRequestData = z.infer<typeof workOrderRequestDataSchema>;

export type WorkOrderFieldErrors = Partial<
  Record<keyof WorkOrderRequestValues, string>
>;

export const initialWorkOrderRequestValues: WorkOrderRequestValues = {
  unit: "",
  category: "",
  tenantName: "",
  email: "",
  phone: "",
  description: "",
  isEmergency: false,
  photos: [],
};
