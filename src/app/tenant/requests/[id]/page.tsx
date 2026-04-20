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
    <main className="px-6 py-12 md:px-8 md:py-16">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
                Tenant Request Detail
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-stone-300">
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
                  <span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-rose-100">
                    Emergency
                  </span>
                ) : null}
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                {workOrder.category}
              </h1>
              <p className="text-lg leading-8 text-stone-300">{workOrder.description}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <TenantSignOutButton />
              <Link
                href="/tenant/requests"
                className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5"
              >
                Back to Request History
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6">
            <h2 className="text-sm uppercase tracking-[0.25em] text-stone-400">
              Request Summary
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-stone-300">
              <p>
                <span className="font-medium text-white">Submitted:</span>{" "}
                {formatWorkOrderDateTime(workOrder.submitted_at ?? null)}
              </p>
              <p>
                <span className="font-medium text-white">Current status:</span>{" "}
                {formatWorkOrderStatus(workOrder.status as WorkOrderStatus)}
              </p>
              <p>
                <span className="font-medium text-white">Completed:</span>{" "}
                {formatWorkOrderDateTime(workOrder.closed_at ?? null)}
              </p>
              <p>
                <span className="font-medium text-white">Tenant access email:</span>{" "}
                {tenantUser.email}
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6">
            <h2 className="text-sm uppercase tracking-[0.25em] text-stone-400">
              Final Report
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-stone-300">
              <p>
                <span className="font-medium text-white">Delivery status:</span>{" "}
                {report?.delivery_status ?? "Not available"}
              </p>
              <p>
                <span className="font-medium text-white">Generated:</span>{" "}
                {formatWorkOrderDateTime(report?.generated_at ?? null)}
              </p>
              <p>
                <span className="font-medium text-white">Delivered:</span>{" "}
                {formatWorkOrderDateTime(report?.delivered_at ?? null)}
              </p>
              {reportMessage ? (
                <p className="rounded-[1rem] border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-rose-100">
                  {reportMessage}
                </p>
              ) : null}
              {report?.generated_at ? (
                <a
                  href={`/api/tenant/reports/${workOrder.id}`}
                  className="inline-flex rounded-full bg-amber-300 px-5 py-3 text-sm font-medium text-stone-950 transition hover:bg-amber-200"
                >
                  Open Final Report
                </a>
              ) : (
                <p className="text-stone-400">
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
