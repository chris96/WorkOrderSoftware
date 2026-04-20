import Link from "next/link";
import { redirect } from "next/navigation";

import { getOptionalTenantUser } from "@/lib/tenant-auth";

export default async function TenantPage() {
  const tenantUser = await getOptionalTenantUser();

  if (tenantUser) {
    redirect("/tenant/requests");
  }

  return (
    <main className="app-shell">
      <div className="app-panel w-full max-w-3xl">
        <p className="app-kicker">Phase 6</p>
        <h1 className="app-heading md:text-4xl">Tenant Portal</h1>
        <p className="app-copy max-w-2xl">
          Tenant access is now moving into active development. Use the sign-in flow
          to request a secure magic link for your request history and final reports.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/tenant/sign-in" className="app-button-primary">
            Tenant Sign-In
          </Link>
          <Link href="/" className="app-button-secondary">
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
