import Link from "next/link";
import { redirect } from "next/navigation";

import { getOptionalTenantUser } from "@/lib/tenant-auth";

export default async function TenantPage() {
  const tenantUser = await getOptionalTenantUser();

  if (tenantUser) {
    redirect("/tenant/requests");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Phase 6</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
          Tenant Portal
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-300">
          Tenant access is now moving into active development. Use the sign-in flow
          to request a secure magic link for your request history and final reports.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/tenant/sign-in"
            className="inline-flex rounded-full bg-amber-300 px-5 py-3 text-sm font-medium text-stone-950 transition hover:bg-amber-200"
          >
            Tenant Sign-In
          </Link>
          <Link
            href="/"
            className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5"
          >
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
