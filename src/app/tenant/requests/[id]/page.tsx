import Link from "next/link";

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
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
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
              <p className="text-stone-400">
                Secure tenant report access will be wired in a later Phase 6 step.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
