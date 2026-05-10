export default function StaffLoading() {
  return (
    <main className="px-6 py-12 md:px-8 md:py-16">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <section className="app-panel">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-5">
              <p className="app-kicker">Staff Portal</p>
              <div className="space-y-4">
                <div className="h-12 w-full max-w-2xl animate-pulse rounded-2xl bg-slate-200/80" />
                <div className="h-5 w-full max-w-xl animate-pulse rounded-full bg-slate-200/80" />
                <div className="h-5 w-3/4 max-w-lg animate-pulse rounded-full bg-slate-200/80" />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="h-11 w-36 animate-pulse rounded-full bg-slate-200/80" />
              <div className="h-11 w-32 animate-pulse rounded-full bg-slate-200/80" />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[1.5rem] border border-slate-200/90 bg-white/72 p-5"
              >
                <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200/80" />
                <div className="mt-4 h-8 w-16 animate-pulse rounded-xl bg-slate-200/80" />
                <div className="mt-3 h-4 w-32 animate-pulse rounded-full bg-slate-200/80" />
              </div>
            ))}
          </div>
        </section>

        <section className="app-panel md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="app-section-label">Staff Dashboard</p>
              <div className="mt-3 h-9 w-64 animate-pulse rounded-2xl bg-slate-200/80" />
            </div>
            <div className="h-5 w-full max-w-xl animate-pulse rounded-full bg-slate-200/80" />
          </div>

          <div className="mt-6 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[1.5rem] border border-slate-200/90 bg-slate-50/88 p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="w-full space-y-3">
                    <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200/80" />
                    <div className="h-7 w-72 animate-pulse rounded-xl bg-slate-200/80" />
                    <div className="h-4 w-full max-w-xl animate-pulse rounded-full bg-slate-200/80" />
                  </div>
                  <div className="h-24 w-full animate-pulse rounded-[1.25rem] bg-slate-200/70 md:w-56" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
