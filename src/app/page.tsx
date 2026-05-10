import Link from "next/link";

export default function Home() {
  const currentDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date("2026-04-15T12:00:00-04:00"));

  return (
    <main className="app-shell">
      <div className="app-panel w-full max-w-5xl md:p-12">
        <div className="grid gap-12 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <section className="space-y-6">
            <p className="app-kicker">Phase 6 Tenant Portal</p>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">
                Phase 6 is now under development for the work order system.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Tenant intake, staff operations, and the closeout workflow are
                live. Repair report generation and tenant completion email delivery
                are now in place, and the next active build phase is tenant
                portal access, request history, and final report visibility.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="app-button-primary" href="/submit-request">
                Submit Request
              </Link>
              <Link className="app-button-secondary" href="/staff">
                Staff Portal
              </Link>
              <Link className="app-button-secondary" href="/tenant">
                Tenant Portal
              </Link>
            </div>
          </section>

          <section className="app-panel-muted">
            <h2 className="app-section-label">Live Now</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              <li>Phase 1 infrastructure is complete with Vercel and Supabase.</li>
              <li>Tenant request intake is live with validation and unit-backed selection.</li>
              <li>Requests can create work orders, upload intake photos, and log submission events.</li>
              <li>Staff can sign in, review request details, add internal notes, update status, and assign work orders.</li>
              <li>Staff can close requests with repair summaries, completion notes, and closeout photos.</li>
              <li>Phase 5 repair reports and tenant completion email delivery are complete.</li>
            </ul>
          </section>
        </div>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="app-panel-muted">
            <h2 className="app-section-label">Recently Completed</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              <li>Public maintenance request form for tenants</li>
              <li>Protected staff portal with bootstrap and sign-in flow</li>
              <li>Filterable staff dashboard for open and recently closed work orders</li>
              <li>Request detail pages with timeline, intake photos, internal notes, assignment, and status controls</li>
              <li>Phase 4 closeout workflow completed and in use</li>
              <li>Phase 5 repair report generation, storage, and tenant email delivery completed</li>
            </ul>
          </div>

          <div className="app-panel-muted">
            <h2 className="app-section-label">Coming Next</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              <li>Phase 6 tenant portal access flow now in development</li>
              <li>Tenant portal history and request visibility improvements</li>
              <li>Tenant-side request detail pages with final report visibility</li>
              <li>Email notifications and emergency escalation at the end of the roadmap</li>
            </ul>
          </div>
        </section>

        <footer className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>This application is currently under development.</p>
          <p>
            Status: Phase 6 in progress, with Phase 5 complete as of {currentDate}
          </p>
        </footer>
      </div>
    </main>
  );
}
