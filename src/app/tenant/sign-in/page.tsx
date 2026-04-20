import Link from "next/link";

import { getOptionalTenantUser } from "@/lib/tenant-auth";

import { TenantSignInForm } from "./tenant-sign-in-form";

export default async function TenantSignInPage() {
  const tenantUser = await getOptionalTenantUser();
  const alreadySignedInMessage = tenantUser
    ? `You are already signed in as ${tenantUser.email}. You can go directly to your request history.`
    : null;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
          Tenant Access
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
          Sign in to the tenant portal.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-300">
          Enter the email used on your maintenance request and we will send you a
          secure sign-in link.
        </p>

        {alreadySignedInMessage ? (
          <div className="mt-8 rounded-[1.25rem] border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm leading-7 text-emerald-50">
            {alreadySignedInMessage}
          </div>
        ) : null}

        <TenantSignInForm />

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/tenant/requests"
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5"
          >
            View Tenant Portal
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
