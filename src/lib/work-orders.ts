export const workOrderStatuses = [
  "new",
  "in_progress",
  "waiting_on_parts",
  "closed",
] as const;

export const activeWorkOrderStatuses = [
  "new",
  "in_progress",
  "waiting_on_parts",
] as const;

export type WorkOrderStatus = (typeof workOrderStatuses)[number];
export type ActiveWorkOrderStatus = (typeof activeWorkOrderStatuses)[number];

export const dashboardStateFilters = ["all", "open", "closed"] as const;
export const emergencyFilters = ["all", "emergency", "standard"] as const;

export type DashboardStateFilter = (typeof dashboardStateFilters)[number];
export type EmergencyFilter = (typeof emergencyFilters)[number];

export function formatWorkOrderDateTime(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(new Date(value));
}

export function formatWorkOrderStatus(status: WorkOrderStatus) {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "waiting_on_parts":
      return "Waiting on Parts";
    case "closed":
      return "Closed";
    default:
      return "New";
  }
}

export function getWorkOrderStatusClassName(status: WorkOrderStatus) {
  switch (status) {
    case "in_progress":
      return "border-sky-200 bg-sky-100 text-sky-900";
    case "waiting_on_parts":
      return "border-violet-200 bg-violet-100 text-violet-900";
    case "closed":
      return "border-emerald-200 bg-emerald-100 text-emerald-900";
    default:
      return "border-amber-200 bg-amber-100 text-amber-900";
  }
}
