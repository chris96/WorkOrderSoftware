import Link from "next/link";
import { redirect } from "next/navigation";

import { getOptionalStaffUser } from "@/lib/staff-auth";

import { SignInForm } from "./sign-in-form";

type StaffSignInPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function StaffSignInPage({
  searchParams,
}: StaffSignInPageProps) {
  const staffUser = await getOptionalStaffUser();

  if (staffUser) {
    redirect("/staff");
  }

  const params = await searchParams;
  const message = params.message?.trim();

  return (
    <main className="px-6 py-12 md:px-8 md:py-16">
      <div className="app-page-grid max-w-6xl">
        <section className="app-aside">
          <p className="app-kicker">Staff Sign-In</p>
          <h1 className="app-heading">
            Access the staff portal.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 md:text-lg">
            Staff sign-in is now the gate into the dashboard work. Use the
            bootstrap flow first if the super and backup accounts have not been
            created yet.
          </p>

          <div className="mt-10 space-y-4">
            <div className="app-note-info">
              <h2 className="text-sm uppercase tracking-[0.24em] text-slate-500">
                Staff access in this phase
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <li>Sign in with the staff credentials created during bootstrap</li>
                <li>Staff routes are protected at the route and page level</li>
                <li>Dashboard buildout comes next on top of this auth foundation</li>
              </ul>
            </div>
          </div>

          <Link
            href="/"
            className="app-button-secondary mt-8"
          >
            Back Home
          </Link>
        </section>

        <section className="app-form-panel">
          <SignInForm initialMessage={message} />
        </section>
      </div>
    </main>
  );
}
