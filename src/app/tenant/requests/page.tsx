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
    <main className="app-shell-page">
      <div className="app-container space-y-8">
        <section className="app-panel">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="app-kicker">Tenant Portal</p>
              <h1 className="app-heading">Your request history</h1>
              <p className="app-copy max-w-3xl">
                This view loads real requests for the authenticated tenant email and
                excludes staff-only fields. Each detail page is protected by a
                server-side ownership check.
              </p>
            </div>

            <TenantSignOutButton />
          </div>

          <div className="app-panel-subtle mt-8">
            <p>
              <span className="font-medium text-slate-900">Signed in as:</span>{" "}
              {tenantUser.email}
            </p>
          </div>
        </section>

        {workOrders.length === 0 ? (
          <section className="app-panel-empty">
            <p className="text-lg font-medium text-slate-900">No requests found yet.</p>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Once a maintenance request is submitted with this email address, it will
              appear here.
            </p>
          </section>
        ) : (
          <section className="space-y-6">
            <div className="app-panel-subtle shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
              <p>
                <span className="font-medium text-slate-900">Requests found:</span>{" "}
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
                  className="app-panel-muted"
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
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
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
                      <Link href={`/tenant/requests/${workOrder.id}`} className="app-button-primary">
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
          <Link href="/tenant/sign-in" className="app-button-secondary">
            Back to Tenant Sign-In
          </Link>
          <Link href="/" className="app-button-secondary">
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
