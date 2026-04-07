import Link from "next/link";

type SubmitRequestSuccessPageProps = {
  searchParams: Promise<{
    duplicate?: string;
    message?: string;
    photoCount?: string;
    requestId?: string;
    status?: string;
    unit?: string;
  }>;
};

function readParam(value: string | undefined) {
  return value?.trim() || undefined;
}

export default async function SubmitRequestSuccessPage({
  searchParams,
}: SubmitRequestSuccessPageProps) {
  const params = await searchParams;

  const duplicate = readParam(params.duplicate) === "true";
  const message =
    readParam(params.message) ??
    (duplicate
      ? "This request had already been submitted recently, so the original work order was kept."
      : "Your maintenance request has been received.");
  const requestId = readParam(params.requestId);
  const status = readParam(params.status);
  const unit = readParam(params.unit);
  const photoCount = Number(readParam(params.photoCount) ?? "0");

  return (
    <main className="px-6 py-12 md:px-8 md:py-16">
      <div className="mx-auto grid w-full max-w-5xl gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/6 p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
            Request Received
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {duplicate
              ? "We already have this request on file."
              : "Your maintenance request was submitted."}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-stone-300 md:text-lg">
            {message}
          </p>

          <div className="mt-10 space-y-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <h2 className="text-sm uppercase tracking-[0.24em] text-stone-400">
                What happens next
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-300">
                <li>The request is now available in the building work order system.</li>
                <li>Staff will review the issue details and any intake photos.</li>
                <li>Future phases will add staff updates, closeout notes, and tenant notifications.</li>
              </ul>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-300/20 bg-emerald-300/8 p-5">
              <p className="text-sm font-medium text-emerald-100">
                Submission protection is active
              </p>
              <p className="mt-2 text-sm leading-7 text-emerald-50/90">
                After a successful submit, this confirmation page replaces the
                form in browser history to reduce accidental repeat submissions.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-stone-950/70 p-6 shadow-2xl shadow-black/40 backdrop-blur md:p-8">
          <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-stone-400">
              Request Summary
            </p>
            <dl className="mt-5 space-y-4 text-sm leading-7 text-stone-300">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <dt className="text-stone-400">Unit</dt>
                <dd className="text-right font-medium text-white">
                  {unit ?? "Not available"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <dt className="text-stone-400">Request ID</dt>
                <dd className="text-right font-medium text-amber-200">
                  {requestId ?? "Not available"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <dt className="text-stone-400">Current status</dt>
                <dd className="text-right font-medium text-white">
                  {status ?? "Not available"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-stone-400">Photos uploaded</dt>
                <dd className="text-right font-medium text-white">
                  {photoCount}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/submit-request"
              className="inline-flex items-center justify-center rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
            >
              Submit Another Request
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5"
            >
              Back Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
