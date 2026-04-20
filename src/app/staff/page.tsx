import Link from "next/link";

import { requireStaffUser } from "@/lib/staff-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  formatWorkOrderDateTime,
  formatWorkOrderStatus,
  getWorkOrderStatusClassName,
  type WorkOrderStatus,
} from "@/lib/work-orders";
import {
  dashboardFilterSchema,
  type DashboardFilters,
} from "@/lib/validation/staff-work-orders";

import { StaffSignOutButton } from "./staff-sign-out-button";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type WorkOrderRow = {
  assigned_user_id: string | null;
  category: string;
  closed_at: string | null;
  description: string;
  id: string;
  is_emergency: boolean;
  status: WorkOrderStatus;
  submitted_at: string;
  tenant_email: string;
  tenant_name: string;
  tenant_phone: string | null;
  unit_id: string | null;
};

type DashboardWorkOrder = WorkOrderRow & {
  assignedUserName: string | null;
  unitNumber: string;
};

function readFilterValue(
  input: string | string[] | undefined
): string | undefined {
  if (Array.isArray(input)) {
    return input[0];
  }

  return input;
}

function parseDashboardFilters(
  rawParams: Record<string, string | string[] | undefined>
): DashboardFilters {
  const parsed = dashboardFilterSchema.safeParse({
    emergency: readFilterValue(rawParams.emergency),
    state: readFilterValue(rawParams.state),
    status: readFilterValue(rawParams.status),
  });

  if (!parsed.success) {
    return dashboardFilterSchema.parse({});
  }

  return parsed.data;
}

function buildWorkOrderQuery(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  filters: DashboardFilters,
  state: "open" | "closed"
) {
  let query = supabase
    .from("work_orders")
    .select(
      "id, unit_id, assigned_user_id, tenant_name, tenant_email, tenant_phone, category, description, status, is_emergency, submitted_at, closed_at"
    );

  if (state === "closed") {
    query = query.eq("status", "closed").order("closed_at", { ascending: false });
  } else {
    query = query.neq("status", "closed").order("submitted_at", { ascending: false });
  }

  if (filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.emergency === "emergency") {
    query = query.eq("is_emergency", true);
  }

  if (filters.emergency === "standard") {
    query = query.eq("is_emergency", false);
  }

  return query.limit(state === "closed" ? 8 : 12);
}

function WorkOrderCard({
  workOrder,
  showClosedDate = false,
}: {
  showClosedDate?: boolean;
  workOrder: DashboardWorkOrder;
}) {
  return (
    <article className="app-panel-muted">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="app-chip">
              Unit {workOrder.unitNumber}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${getWorkOrderStatusClassName(workOrder.status)}`}
            >
              {formatWorkOrderStatus(workOrder.status)}
            </span>
            {workOrder.is_emergency ? (
              <span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-rose-100">
                Emergency
              </span>
            ) : null}
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            {workOrder.category}
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            {workOrder.description}
          </p>
        </div>

        <div className="app-panel-subtle md:min-w-[220px]">
          <p>
            Request ID: <span className="text-blue-700">{workOrder.id}</span>
          </p>
          <p>Submitted: {formatWorkOrderDateTime(workOrder.submitted_at)}</p>
          {showClosedDate ? (
            <p>Closed: {formatWorkOrderDateTime(workOrder.closed_at)}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="app-panel-subtle p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Tenant
          </p>
          <p className="mt-2 font-medium text-slate-900">{workOrder.tenant_name}</p>
          <p>{workOrder.tenant_email}</p>
          <p>{workOrder.tenant_phone || "No phone provided"}</p>
        </div>

        <div className="app-panel-subtle p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Assignment
          </p>
          <p className="mt-2 font-medium text-slate-900">
            {workOrder.assignedUserName || "Unassigned"}
          </p>
          <p>
            {workOrder.is_emergency
              ? "Flagged by the tenant as urgent."
              : "Standard request priority."}
          </p>
        </div>

        <div className="app-panel-subtle flex flex-col justify-between p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Next step
            </p>
            <p className="mt-2 font-medium text-slate-900">
              Open the full request view
            </p>
            <p>Review timeline, notes, photos, assignment, and status actions.</p>
          </div>
          <Link
            href={`/staff/work-orders/${workOrder.id}`}
            className="app-button-primary mt-4 items-center justify-center px-4 py-2"
          >
            Open Request
          </Link>
        </div>
      </div>
    </article>
  );
}

function DashboardSection({
  description,
  emptyBody,
  emptyTitle,
  title,
  workOrders,
}: {
  description: string;
  emptyBody: string;
  emptyTitle: string;
  title: string;
  workOrders: DashboardWorkOrder[];
}) {
  const showClosedDate = title === "Recently Closed";

  return (
    <section className="app-panel md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="app-section-label">Staff Dashboard</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{title}</h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-slate-500">{description}</p>
      </div>

      {workOrders.length === 0 ? (
        <div className="app-panel-empty mt-6">
          <p className="text-lg font-medium text-slate-900">{emptyTitle}</p>
          <p className="mt-3 text-sm leading-7 text-slate-500">{emptyBody}</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {workOrders.map((workOrder) => (
            <WorkOrderCard
              key={workOrder.id}
              workOrder={workOrder}
              showClosedDate={showClosedDate}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function StaffPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const staffUser = await requireStaffUser();
  const filters = parseDashboardFilters(await searchParams);
  const supabase = createAdminSupabaseClient();

  const [openResult, closedResult, staffUsersResult] = await Promise.all([
    filters.state === "closed"
      ? Promise.resolve({ data: [], error: null })
      : buildWorkOrderQuery(supabase, filters, "open"),
    filters.state === "open"
      ? Promise.resolve({ data: [], error: null })
      : buildWorkOrderQuery(supabase, filters, "closed"),
    supabase
      .from("users")
      .select("id, full_name")
      .eq("is_active", true)
      .in("role", ["super", "backup"]),
  ]);

  const openWorkOrders = (openResult.data ?? []) as WorkOrderRow[];
  const recentlyClosedWorkOrders = (closedResult.data ?? []) as WorkOrderRow[];
  const dashboardError =
    openResult.error || closedResult.error || staffUsersResult.error;

  const unitIds = Array.from(
    new Set(
      [...openWorkOrders, ...recentlyClosedWorkOrders]
        .map((workOrder) => workOrder.unit_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  const unitMap = new Map<string, string>();

  if (unitIds.length > 0) {
    const { data: units } = await supabase
      .from("units")
      .select("id, unit_number")
      .in("id", unitIds);

    for (const unit of units ?? []) {
      unitMap.set(unit.id, unit.unit_number);
    }
  }

  const staffUserMap = new Map<string, string>();

  for (const user of staffUsersResult.data ?? []) {
    staffUserMap.set(user.id, user.full_name);
  }

  const decorateWorkOrder = (workOrder: WorkOrderRow): DashboardWorkOrder => ({
    ...workOrder,
    assignedUserName:
      (workOrder.assigned_user_id &&
        staffUserMap.get(workOrder.assigned_user_id)) ||
      null,
    unitNumber:
      (workOrder.unit_id && unitMap.get(workOrder.unit_id)) || "Unknown unit",
  });

  const openDashboardWorkOrders = openWorkOrders.map(decorateWorkOrder);
  const closedDashboardWorkOrders = recentlyClosedWorkOrders.map(decorateWorkOrder);

  const emergencyCount = openDashboardWorkOrders.filter(
    (workOrder) => workOrder.is_emergency
  ).length;

  return (
    <main className="px-6 py-12 md:px-8 md:py-16">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <section className="app-panel">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-5">
              <p className="app-kicker">Phase 3 Staff Dashboard</p>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                  Staff operations are now live for {staffUser.fullName}.
                </h1>
                <p className="text-lg leading-8 text-slate-600">
                  The staff workflow now includes a live dashboard and begins to
                  branch into request-level operations. Filters below can narrow
                  the queue by state, status, and urgency before you open a
                  specific work order.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/staff/bootstrap"
                className="app-button-secondary"
              >
                Bootstrap Staff Users
              </Link>
              <Link
                href="/submit-request"
                className="app-button-secondary"
              >
                View Tenant Intake
              </Link>
              <StaffSignOutButton />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="app-stat-card">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                Signed in
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {staffUser.role}
              </p>
              <p className="mt-1 text-sm text-slate-500">{staffUser.email}</p>
            </div>

            <div className="app-stat-card">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                Open work orders
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {openDashboardWorkOrders.length}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                New, in progress, or waiting on parts
              </p>
            </div>

            <div className="app-stat-card">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                Emergency queue
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {emergencyCount}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Open requests currently marked urgent
              </p>
            </div>

            <div className="app-stat-card">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                Recently closed
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {closedDashboardWorkOrders.length}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Most recent completed repair records
              </p>
            </div>
          </div>

          <form className="app-filter-shell">
            <div className="space-y-2">
              <label htmlFor="state" className="app-label">
                Open vs closed
              </label>
              <select
                id="state"
                name="state"
                defaultValue={filters.state}
                className="app-input"
              >
                <option value="all" className="bg-white text-slate-900">
                  All work orders
                </option>
                <option value="open" className="bg-white text-slate-900">
                  Open only
                </option>
                <option value="closed" className="bg-white text-slate-900">
                  Closed only
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="app-label">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={filters.status}
                className="app-input"
              >
                <option value="all" className="bg-white text-slate-900">
                  Any status
                </option>
                <option value="new" className="bg-white text-slate-900">
                  New
                </option>
                <option value="in_progress" className="bg-white text-slate-900">
                  In Progress
                </option>
                <option
                  value="waiting_on_parts"
                  className="bg-white text-slate-900"
                >
                  Waiting on Parts
                </option>
                <option value="closed" className="bg-white text-slate-900">
                  Closed
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="emergency"
                className="app-label"
              >
                Emergency filter
              </label>
              <select
                id="emergency"
                name="emergency"
                defaultValue={filters.emergency}
                className="app-input"
              >
                <option value="all" className="bg-white text-slate-900">
                  All priorities
                </option>
                <option value="emergency" className="bg-white text-slate-900">
                  Emergency only
                </option>
                <option value="standard" className="bg-white text-slate-900">
                  Standard only
                </option>
              </select>
            </div>

            <button
              type="submit"
              className="app-button-primary px-6 font-semibold md:self-end"
            >
              Apply Filters
            </button>
            <Link
              href="/staff"
              className="app-button-secondary items-center justify-center px-6 md:self-end"
            >
              Reset
            </Link>
          </form>

          {dashboardError ? (
            <div className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm leading-7 text-rose-800">
              The dashboard could not load all work order data yet:{" "}
              {dashboardError.message}
            </div>
          ) : null}
        </section>

        {filters.state !== "closed" ? (
          <DashboardSection
            title="Open Work Orders"
            description="This queue is designed for fast operational triage. It keeps unit, tenant, assignment, urgency, and status visible at a glance before you open the full request view."
            workOrders={openDashboardWorkOrders}
            emptyTitle="No open work orders match these filters."
            emptyBody="Try widening the state, status, or emergency filter to bring more requests back into view."
          />
        ) : null}

        {filters.state !== "open" ? (
          <DashboardSection
            title="Recently Closed"
            description="Closed requests stay visible here so staff can confirm what finished most recently and still jump into the full history for each request."
            workOrders={closedDashboardWorkOrders}
            emptyTitle="No closed work orders match these filters."
            emptyBody="Try widening the state, status, or emergency filter to bring completed requests back into view."
          />
        ) : null}
      </div>
    </main>
  );
}
