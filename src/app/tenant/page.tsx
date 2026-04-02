import Link from "next/link";

export default function TenantPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
          Placeholder Route
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
          Tenant Portal
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-300">
          This page will later show tenants their request history, active work
          orders, and final repair reports.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5"
        >
          Back Home
        </Link>
      </div>
    </main>
  );
}
