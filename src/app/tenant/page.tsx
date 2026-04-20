import Link from "next/link";
import { redirect } from "next/navigation";

import { getOptionalTenantUser } from "@/lib/tenant-auth";

export default async function TenantPage() {
  const tenantUser = await getOptionalTenantUser();

  if (tenantUser) {
    redirect("/tenant/requests");
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.18),_transparent_38%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_48%,_#e6edf8_100%)] px-6 py-16 text-slate-900">
      <div className="w-full max-w-3xl rounded-[2rem] border border-sky-200/70 bg-white/90 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur md:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-700">Phase 6</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
          Tenant Portal
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          Tenant access is now moving into active development. Use the sign-in flow
          to request a secure magic link for your request history and final reports.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/tenant/sign-in"
            className="inline-flex rounded-full bg-sky-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-500"
          >
            Tenant Sign-In
          </Link>
          <Link
            href="/"
            className="inline-flex rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
          >
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
