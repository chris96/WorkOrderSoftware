import Link from "next/link";

import { BootstrapForm } from "./bootstrap-form";

export default function StaffBootstrapPage() {
  return (
    <main className="px-6 py-12 md:px-8 md:py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/6 p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
            Phase 3 Setup
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Create the initial staff accounts.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-stone-300 md:text-lg">
            This bootstrap screen is the first step toward the staff dashboard.
            It creates the initial <span className="text-white">super</span> and{" "}
            <span className="text-white">backup</span> users in Supabase Auth
            and mirrors them into the application database.
          </p>

          <div className="mt-10 space-y-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <h2 className="text-sm uppercase tracking-[0.24em] text-stone-400">
                What this setup does
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-300">
                <li>Creates a staff auth account with a temporary password</li>
                <li>Adds the matching record to the app&apos;s <code>users</code> table</li>
                <li>Locks the action behind a bootstrap key stored in env vars</li>
              </ul>
            </div>

            <div className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/8 p-5">
              <p className="text-sm font-medium text-amber-100">
                Recommended order
              </p>
              <p className="mt-2 text-sm leading-7 text-amber-50/90">
                Create the super account first, then the backup account. After
                both exist, rotate the bootstrap key so this setup route is no
                longer reusable.
              </p>
            </div>
          </div>

          <Link
            href="/staff"
            className="mt-8 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5"
          >
            Back to Staff Portal
          </Link>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-stone-950/70 p-6 shadow-2xl shadow-black/40 backdrop-blur md:p-8">
          <BootstrapForm />
        </section>
      </div>
    </main>
  );
}
