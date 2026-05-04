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
    <main className="app-shell">
      <div className="app-panel w-full max-w-3xl">
        <p className="app-kicker">Tenant Access</p>
        <h1 className="app-heading md:text-4xl">Sign in to the tenant portal.</h1>
        <p className="app-copy max-w-2xl">
          Enter the email used on your maintenance request and we will send you a
          secure sign-in link.
        </p>

        {alreadySignedInMessage ? (
          <div className="app-alert-success mt-8">{alreadySignedInMessage}</div>
        ) : null}

        {errorMessage ? (
          <div className="app-alert-error mt-5">{errorMessage}</div>
        ) : null}

        <TenantSignInForm />

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/tenant/requests" className="app-button-secondary">
            View Tenant Portal
          </Link>
          <Link href="/" className="app-button-secondary">
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
