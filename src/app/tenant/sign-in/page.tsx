import Link from "next/link";
import { redirect } from "next/navigation";

import { getOptionalTenantUser } from "@/lib/tenant-auth";

import { TenantSignInForm } from "./tenant-sign-in-form";

function getTenantSignInErrorMessage(errorCode: string | undefined) {
  if (errorCode === "invalid_link") {
    return "That sign-in link is no longer valid. Request a new access link below.";
  }

  if (errorCode === "missing_code") {
    return "The sign-in link was incomplete. Request a new access link below.";
  }

  return null;
}

export default async function TenantSignInPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
  }>;
}) {
  const tenantUser = await getOptionalTenantUser();
  const { error } = await searchParams;

  if (tenantUser && !error) {
    redirect("/tenant/requests");
  }

  const alreadySignedInMessage = tenantUser
    ? `You are already signed in as ${tenantUser.email}. You can go directly to your request history.`
    : null;
  const errorMessage = getTenantSignInErrorMessage(error);

  return (
    <main className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.18),_transparent_38%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_48%,_#e6edf8_100%)] px-6 py-16 text-slate-900">
      <div className="w-full max-w-3xl rounded-[2rem] border border-sky-200/70 bg-white/90 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur md:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-700">
          Tenant Access
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
          Sign in to the tenant portal.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          Enter the email used on your maintenance request and we will send you a
          secure sign-in link.
        </p>

        {alreadySignedInMessage ? (
          <div className="mt-8 rounded-[1.25rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-900">
            {alreadySignedInMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-5 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-900">
            {errorMessage}
          </div>
        ) : null}

        <TenantSignInForm />

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/tenant/requests"
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
          >
            View Tenant Portal
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
