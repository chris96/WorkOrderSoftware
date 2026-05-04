import Link from "next/link";

import { TenantSignOutButton } from "@/app/tenant/tenant-sign-out-button";
import { requireTenantOwnedWorkOrder } from "@/lib/tenant-auth";
import {
  formatWorkOrderDateTime,
  formatWorkOrderStatus,
  getWorkOrderStatusClassName,
  type WorkOrderStatus,
} from "@/lib/work-orders";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export default async function TenantRequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    report?: string;
  }>;
}) {
  const { id } = await params;
  const { report: reportState } = await searchParams;
  const { tenantUser, workOrder } = await requireTenantOwnedWorkOrder(id);
  const supabase = createAdminSupabaseClient();

  let unitNumber = "Unknown unit";

  if (workOrder.unit_id) {
    const { data: unit } = await supabase
      .from("units")
      .select("unit_number")
      .eq("id", workOrder.unit_id)
      .single();

    unitNumber = unit?.unit_number ?? unitNumber;
  }

  const { data: report } = await supabase
    .from("reports")
    .select("delivery_status, generated_at, delivered_at")
    .eq("work_order_id", workOrder.id)
    .maybeSingle();

  let reportMessage: string | null = null;

  if (reportState === "not_ready") {
    reportMessage = "The final report is not available yet.";
  } else if (reportState === "lookup_error" || reportState === "access_error") {
    reportMessage = "The final report could not be opened right now.";
  }

  return (
    <main className="app-shell-page">
      <div className="app-container space-y-8">
        <section className="app-panel">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="app-kicker">Tenant Request Detail</p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-600">
                  Unit {unitNumber}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${getWorkOrderStatusClassName(
                    workOrder.status as WorkOrderStatus
                  )}`}
                >
                  {formatWorkOrderStatus(workOrder.status as WorkOrderStatus)}
                </span>
                {workOrder.is_emergency ? (
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-rose-700">
                    Emergency
                  </span>
                ) : null}
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                {workOrder.category}
              </h1>
              <p className="text-lg leading-8 text-slate-600">{workOrder.description}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <TenantSignOutButton />
              <Link href="/tenant/requests" className="app-button-secondary">
                Back to Request History
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="app-panel-muted">
            <h2 className="app-section-label">Request Summary</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <p>
                <span className="font-medium text-slate-900">Submitted:</span>{" "}
                {formatWorkOrderDateTime(workOrder.submitted_at ?? null)}
              </p>
              <p>
                <span className="font-medium text-slate-900">Current status:</span>{" "}
                {formatWorkOrderStatus(workOrder.status as WorkOrderStatus)}
              </p>
              <p>
                <span className="font-medium text-slate-900">Completed:</span>{" "}
                {formatWorkOrderDateTime(workOrder.closed_at ?? null)}
              </p>
              <p>
                <span className="font-medium text-slate-900">Tenant access email:</span>{" "}
                {tenantUser.email}
              </p>
            </div>
          </div>

          <div className="app-panel-muted">
            <h2 className="app-section-label">Final Report</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <p>
                <span className="font-medium text-slate-900">Delivery status:</span>{" "}
                {report?.delivery_status ?? "Not available"}
              </p>
              <p>
                <span className="font-medium text-slate-900">Generated:</span>{" "}
                {formatWorkOrderDateTime(report?.generated_at ?? null)}
              </p>
              <p>
                <span className="font-medium text-slate-900">Delivered:</span>{" "}
                {formatWorkOrderDateTime(report?.delivered_at ?? null)}
              </p>
              {reportMessage ? (
                <p className="app-alert-error rounded-[1rem]">
                  {reportMessage}
                </p>
              ) : null}
              {report?.generated_at ? (
                <a
                  href={`/api/tenant/reports/${workOrder.id}`}
                  className="app-button-primary"
                >
                  Open Final Report
                </a>
              ) : (
                <p className="text-slate-500">
                  The final report is not ready yet for this request.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
