import Link from "next/link";

export default function Home() {
  const currentDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date("2026-04-08T12:00:00-04:00"));

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-5xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-12">
        <div className="grid gap-12 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <section className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
              Phase 3 Staff Dashboard
            </p>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
                Phase 3 is complete for the work order system.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-stone-300">
                Tenant intake and the core staff workflow are now live.
                Residents can submit requests, and staff can sign in, review
                work orders, add internal notes, manage status, and assign work.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="rounded-full bg-amber-300 px-5 py-3 text-sm font-medium text-stone-950 transition hover:bg-amber-200" href="/submit-request">
                Submit Request
              </Link>
              <Link className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5" href="/staff">
                Staff Portal
              </Link>
              <Link className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5" href="/tenant">
                Tenant Portal
              </Link>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6">
            <h2 className="text-sm uppercase tracking-[0.25em] text-stone-400">
              Live Now
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-300">
              <li>Phase 1 infrastructure is complete with Vercel and Supabase.</li>
              <li>Tenant request intake is live with validation and unit-backed selection.</li>
              <li>Requests can create work orders, upload intake photos, and log submission events.</li>
              <li>Staff can sign in, review request details, add internal notes, update status, and assign work orders.</li>
            </ul>
          </section>
        </div>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6">
            <h2 className="text-sm uppercase tracking-[0.25em] text-stone-400">
              Recently Completed
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-300">
              <li>Public maintenance request form for tenants</li>
              <li>Protected staff portal with bootstrap and sign-in flow</li>
              <li>Filterable staff dashboard for open and recently closed work orders</li>
              <li>Request detail pages with timeline, intake photos, internal notes, assignment, and status controls</li>
            </ul>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6">
            <h2 className="text-sm uppercase tracking-[0.25em] text-stone-400">
              Coming Next
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-300">
              <li>Closeout workflow for repairs, completion notes, and closeout photos</li>
              <li>Report generation and tenant completion emails</li>
              <li>Tenant portal history and request visibility improvements</li>
              <li>Email notifications and emergency escalation at the end of the roadmap</li>
            </ul>
          </div>
        </section>

        <footer className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-sm text-stone-400 md:flex-row md:items-center md:justify-between">
          <p>This application is currently under development.</p>
          <p>
            Status: Phase 3 complete as of {currentDate}
          </p>
        </footer>
      </div>
    </main>
  );
}
