import Link from "next/link";

import { listTenantWorkOrders } from "@/lib/tenant-auth";
import {
  formatWorkOrderDateTime,
  formatWorkOrderStatus,
  getWorkOrderStatusClassName,
  type WorkOrderStatus,
} from "@/lib/work-orders";

export default async function TenantRequestsPage() {
  const { tenantUser, workOrders } = await listTenantWorkOrders();

  return (
    <main className="px-6 py-12 md:px-8 md:py-16">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
            Tenant Portal
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Your request history
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
            This view now loads real requests for the authenticated tenant email and
            excludes staff-only fields. Each detail page is protected by a server-side
            ownership check.
          </p>

          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-stone-300">
            <p>
              <span className="font-medium text-white">Signed in as:</span>{" "}
              {tenantUser.email}
            </p>
          </div>
        </section>

        {workOrders.length === 0 ? (
          <section className="rounded-[2rem] border border-dashed border-white/10 bg-black/20 px-6 py-8 text-center">
            <p className="text-lg font-medium text-white">No requests found yet.</p>
            <p className="mt-3 text-sm leading-7 text-stone-400">
              Once a maintenance request is submitted with this email address, it will
              appear here.
            </p>
          </section>
        ) : (
          <section className="grid gap-4">
            {workOrders.map((workOrder) => (
              <article
                key={workOrder.id}
                className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6"
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
                        <span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-rose-100">
                          Emergency
                        </span>
                      ) : null}
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight text-white">
                      {workOrder.category}
                    </h2>
                    <div className="space-y-1 text-sm leading-7 text-stone-300">
                      <p>Submitted {formatWorkOrderDateTime(workOrder.submitted_at)}</p>
                      <p>Completed {formatWorkOrderDateTime(workOrder.closed_at)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/tenant/requests/${workOrder.id}`}
                      className="inline-flex rounded-full bg-amber-300 px-5 py-3 text-sm font-medium text-stone-950 transition hover:bg-amber-200"
                    >
                      Open Request
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            href="/tenant/sign-in"
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5"
          >
            Back to Tenant Sign-In
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5"
          >
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
