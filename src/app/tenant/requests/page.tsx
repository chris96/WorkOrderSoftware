import Link from "next/link";

import { listTenantWorkOrders } from "@/lib/tenant-auth";
import {
  formatWorkOrderDateTime,
  formatWorkOrderStatus,
  getWorkOrderStatusClassName,
  type WorkOrderStatus,
} from "@/lib/work-orders";
import { TenantSignOutButton } from "@/app/tenant/tenant-sign-out-button";

export default async function TenantRequestsPage() {
  const { tenantUser, workOrders } = await listTenantWorkOrders();

  return (
    <main className="bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.16),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_48%,_#e6edf8_100%)] px-6 py-12 text-slate-900 md:px-8 md:py-16">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <section className="rounded-[2rem] border border-sky-200/70 bg-white/90 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-700">
                Tenant Portal
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                Your request history
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                This view loads real requests for the authenticated tenant email and
                excludes staff-only fields. Each detail page is protected by a
                server-side ownership check.
              </p>
            </div>

            <TenantSignOutButton />
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
            <p>
              <span className="font-medium text-slate-950">Signed in as:</span>{" "}
              {tenantUser.email}
            </p>
          </div>
        </section>

        {workOrders.length === 0 ? (
          <section className="rounded-[2rem] border border-dashed border-sky-200 bg-white/70 px-6 py-8 text-center shadow-[0_16px_45px_rgba(15,23,42,0.08)]">
            <p className="text-lg font-medium text-slate-950">No requests found yet.</p>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Once a maintenance request is submitted with this email address, it will
              appear here.
            </p>
          </section>
        ) : (
          <section className="space-y-6">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-5 text-sm leading-7 text-slate-700 shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
              <p>
                <span className="font-medium text-slate-950">Requests found:</span>{" "}
                {workOrders.length}
              </p>
              <p className="text-slate-500">
                Open requests and completed requests are both shown here. Cards now
                indicate when a final report is ready.
              </p>
            </div>

            <div className="grid gap-4">
              {workOrders.map((workOrder) => (
                <article
                  key={workOrder.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-white/85 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
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
                        {workOrder.report_generated_at ? (
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-sky-700">
                            Report Ready
                          </span>
                        ) : null}
                      </div>
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                        {workOrder.category}
                      </h2>
                      <div className="space-y-1 text-sm leading-7 text-slate-600">
                        <p>Submitted {formatWorkOrderDateTime(workOrder.submitted_at)}</p>
                        <p>Completed {formatWorkOrderDateTime(workOrder.closed_at)}</p>
                        <p>
                          Final report:{" "}
                          {workOrder.report_generated_at
                            ? "Available in request detail"
                            : "Not ready yet"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/tenant/requests/${workOrder.id}`}
                        className="inline-flex rounded-full bg-sky-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-500"
                      >
                        Open Request
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            href="/tenant/sign-in"
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
          >
            Back to Tenant Sign-In
          </Link>
          <Link
            href="/"
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
          >
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
