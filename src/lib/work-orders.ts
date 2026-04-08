export const workOrderStatuses = [
  "new",
  "in_progress",
  "waiting_on_parts",
  "closed",
] as const;

export type WorkOrderStatus = (typeof workOrderStatuses)[number];

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
      return "border-sky-300/20 bg-sky-400/10 text-sky-100";
    case "waiting_on_parts":
      return "border-violet-300/20 bg-violet-400/10 text-violet-100";
    case "closed":
      return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
    default:
      return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  }
}
