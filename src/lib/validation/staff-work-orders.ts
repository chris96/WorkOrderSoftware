import { z } from "zod";

import {
  dashboardStateFilters,
  emergencyFilters,
  workOrderStatuses,
} from "@/lib/work-orders";

export const dashboardFilterSchema = z.object({
  emergency: z.enum(emergencyFilters).default("all"),
  state: z.enum(dashboardStateFilters).default("all"),
  status: z.union([z.enum(workOrderStatuses), z.literal("all")]).default("all"),
});

export const workOrderUpdateSchema = z.object({
  assignedUserId: z.string().uuid().nullable(),
  status: z.enum(workOrderStatuses),
});

export const internalNoteSchema = z.object({
  note: z
    .string()
    .trim()
    .min(2, "Please enter a note before saving.")
    .max(2000, "Please keep internal notes under 2000 characters."),
});

export type DashboardFilters = z.infer<typeof dashboardFilterSchema>;
export type WorkOrderUpdateValues = z.infer<typeof workOrderUpdateSchema>;
export type InternalNoteValues = z.infer<typeof internalNoteSchema>;
