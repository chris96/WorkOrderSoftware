import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-5xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-12">
        <div className="grid gap-12 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <section className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
              Phase 1 Foundation
            </p>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
                Work order software for a 90-unit building.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-stone-300">
                This starter site gives us a clean App Router foundation on
                Vercel while we design the real homepage and build the tenant
                request flow next.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="rounded-full bg-amber-300 px-5 py-3 text-sm font-medium text-stone-950 transition hover:bg-amber-200" href="/submit-request">
                Submit Request
              </Link>
              <Link className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5" href="/staff">
                Staff Area
              </Link>
              <Link className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5" href="/tenant">
                Tenant Portal
              </Link>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6">
            <h2 className="text-sm uppercase tracking-[0.25em] text-stone-400">
              Current Scope
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-300">
              <li>App Router project scaffolded with TypeScript and Tailwind.</li>
              <li>Homepage plus placeholder routes for tenant and staff flows.</li>
              <li>Ready for local development, GitHub, and Vercel deployment.</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
