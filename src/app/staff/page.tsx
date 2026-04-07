import Link from "next/link";

import { requireStaffUser } from "@/lib/staff-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

import { StaffSignOutButton } from "./staff-sign-out-button";

type WorkOrderRow = {
  category: string;
  closed_at: string | null;
  description: string;
  id: string;
  is_emergency: boolean;
  status: "new" | "in_progress" | "waiting_on_parts" | "closed";
  submitted_at: string;
  tenant_email: string;
  tenant_name: string;
  tenant_phone: string | null;
  unit_id: string | null;
};

type DashboardWorkOrder = WorkOrderRow & {
  unitNumber: string;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(new Date(value));
}

function formatStatus(status: DashboardWorkOrder["status"]) {
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

function getStatusClassName(status: DashboardWorkOrder["status"]) {
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

function WorkOrderCard({
  workOrder,
  showClosedDate = false,
}: {
  showClosedDate?: boolean;
  workOrder: DashboardWorkOrder;
}) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-stone-300">
              Unit {workOrder.unitNumber}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${getStatusClassName(workOrder.status)}`}
            >
              {formatStatus(workOrder.status)}
            </span>
            {workOrder.is_emergency ? (
              <span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-rose-100">
                Emergency
              </span>
            ) : null}
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-white">
            {workOrder.category}
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-stone-300">
            {workOrder.description}
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-stone-300 md:min-w-[220px]">
          <p>
            Request ID: <span className="text-amber-200">{workOrder.id}</span>
          </p>
          <p>Submitted: {formatDateTime(workOrder.submitted_at)}</p>
          {showClosedDate ? (
            <p>Closed: {formatDateTime(workOrder.closed_at)}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-stone-300">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
            Tenant
          </p>
          <p className="mt-2 font-medium text-white">{workOrder.tenant_name}</p>
          <p>{workOrder.tenant_email}</p>
          <p>{workOrder.tenant_phone || "No phone provided"}</p>
        </div>

        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-stone-300">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
            Current state
          </p>
          <p className="mt-2 font-medium text-white">{formatStatus(workOrder.status)}</p>
          <p>
            {workOrder.is_emergency
              ? "Flagged by the tenant as urgent."
              : "Standard request priority."}
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-stone-300">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
            Next build step
          </p>
          <p className="mt-2 font-medium text-white">
            Detail page, assignment, and status controls
          </p>
          <p>Those controls will be layered onto this list in the next pass.</p>
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
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-stone-400">
            Staff Dashboard
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {title}
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-stone-400">{description}</p>
      </div>

      {workOrders.length === 0 ? (
        <div className="mt-6 rounded-[1.75rem] border border-dashed border-white/10 bg-black/20 px-6 py-8 text-center">
          <p className="text-lg font-medium text-white">{emptyTitle}</p>
          <p className="mt-3 text-sm leading-7 text-stone-400">{emptyBody}</p>
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

export default async function StaffPage() {
  const staffUser = await requireStaffUser();
  const supabase = createAdminSupabaseClient();

  const [openResult, closedResult] = await Promise.all([
    supabase
      .from("work_orders")
      .select(
        "id, unit_id, tenant_name, tenant_email, tenant_phone, category, description, status, is_emergency, submitted_at, closed_at"
      )
      .neq("status", "closed")
      .order("submitted_at", { ascending: false })
      .limit(12),
    supabase
      .from("work_orders")
      .select(
        "id, unit_id, tenant_name, tenant_email, tenant_phone, category, description, status, is_emergency, submitted_at, closed_at"
      )
      .eq("status", "closed")
      .order("closed_at", { ascending: false })
      .limit(8),
  ]);

  const openWorkOrders = (openResult.data ?? []) as WorkOrderRow[];
  const recentlyClosedWorkOrders = (closedResult.data ?? []) as WorkOrderRow[];
  const dashboardError = openResult.error || closedResult.error;

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

  const decorateWorkOrder = (workOrder: WorkOrderRow): DashboardWorkOrder => ({
    ...workOrder,
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
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-5">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
                Phase 3 Staff Dashboard
              </p>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                  Staff operations are now live for {staffUser.fullName}.
                </h1>
                <p className="text-lg leading-8 text-stone-300">
                  This first dashboard pass surfaces active and recently closed
                  work orders so the building team can review the current queue
                  before we add filters, detail views, notes, assignment, and
                  status controls.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/staff/bootstrap"
                className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5"
              >
                Bootstrap Staff Users
              </Link>
              <Link
                href="/submit-request"
                className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5"
              >
                View Tenant Intake
              </Link>
              <StaffSignOutButton />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
                Signed in
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {staffUser.role}
              </p>
              <p className="mt-1 text-sm text-stone-400">{staffUser.email}</p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
                Open work orders
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {openDashboardWorkOrders.length}
              </p>
              <p className="mt-1 text-sm text-stone-400">
                New, in progress, or waiting on parts
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
                Emergency queue
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {emergencyCount}
              </p>
              <p className="mt-1 text-sm text-stone-400">
                Open requests currently marked urgent
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
                Recently closed
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {closedDashboardWorkOrders.length}
              </p>
              <p className="mt-1 text-sm text-stone-400">
                Most recent completed repair records
              </p>
            </div>
          </div>

          {dashboardError ? (
            <div className="mt-6 rounded-[1.5rem] border border-rose-300/25 bg-rose-400/10 px-5 py-4 text-sm leading-7 text-rose-100">
              The dashboard could not load all work order data yet:{" "}
              {dashboardError.message}
            </div>
          ) : null}
        </section>

        <DashboardSection
          title="Open Work Orders"
          description="This queue is designed for fast operational triage. It highlights the newest active requests first while keeping unit, tenant, urgency, and status visible at a glance."
          workOrders={openDashboardWorkOrders}
          emptyTitle="No open work orders right now."
          emptyBody="Once new tenant requests arrive, they will appear here automatically with their unit, contact details, and current status."
        />

        <DashboardSection
          title="Recently Closed"
          description="Closed requests stay visible here so staff can quickly confirm what was finished most recently before the closeout workflow and reporting layers are added."
          workOrders={closedDashboardWorkOrders}
          emptyTitle="No closed work orders yet."
          emptyBody="Completed repairs will appear here once the closeout portion of the workflow is in place and requests begin moving to the closed state."
        />
      </div>
    </main>
  );
}
