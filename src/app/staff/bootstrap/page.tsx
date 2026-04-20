import Link from "next/link";

import { BootstrapForm } from "./bootstrap-form";

export default function StaffBootstrapPage() {
  return (
    <main className="px-6 py-12 md:px-8 md:py-16">
      <div className="app-page-grid max-w-6xl">
        <section className="app-aside">
          <p className="app-kicker">Phase 3 Setup</p>
          <h1 className="app-heading">
            Create the initial staff accounts.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 md:text-lg">
            This bootstrap screen is the first step toward the staff dashboard.
            It creates the initial <span className="font-semibold text-slate-900">super</span> and{" "}
            <span className="font-semibold text-slate-900">backup</span> users in Supabase Auth
            and mirrors them into the application database.
          </p>

          <div className="mt-10 space-y-4">
            <div className="app-note-info">
              <h2 className="text-sm uppercase tracking-[0.24em] text-slate-500">
                What this setup does
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <li>Creates a staff auth account with a temporary password</li>
                <li>Adds the matching record to the app&apos;s <code>users</code> table</li>
                <li>Locks the action behind a bootstrap key stored in env vars</li>
              </ul>
            </div>

            <div className="app-note-accent">
              <p className="text-sm font-medium text-blue-800">
                Recommended order
              </p>
              <p className="mt-2 text-sm leading-7 text-blue-900/80">
                Create the super account first, then the backup account. After
                both exist, rotate the bootstrap key so this setup route is no
                longer reusable.
              </p>
            </div>
          </div>

          <Link
            href="/staff"
            className="app-button-secondary mt-8"
          >
            Back to Staff Portal
          </Link>
        </section>

        <section className="app-form-panel">
          <BootstrapForm />
        </section>
      </div>
    </main>
  );
}
