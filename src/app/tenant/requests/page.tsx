import Link from "next/link";

import { requireTenantUser } from "@/lib/tenant-auth";

export default async function TenantRequestsPage() {
  const tenantUser = await requireTenantUser();

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
          Tenant Portal
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
          Your request history
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-300">
          Step 2 is now in place. Tenant magic-link access works and authenticated
          tenants land in this protected area. The next step is to replace this
          placeholder with the real request history view.
        </p>

        <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-stone-300">
          <p>
            <span className="font-medium text-white">Signed in as:</span>{" "}
            {tenantUser.email}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
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
