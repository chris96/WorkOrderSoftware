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
      <div className="app-page-grid max-w-5xl">
        <section className="app-aside">
          <p className="app-kicker">Request Received</p>
          <h1 className="app-heading">
            {duplicate
              ? "We already have this request on file."
              : "Your maintenance request was submitted."}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 md:text-lg">
            {message}
          </p>

          <div className="mt-10 space-y-4">
            <div className="app-note-info">
              <h2 className="text-sm uppercase tracking-[0.24em] text-slate-500">
                What happens next
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <li>The request is now available in the building work order system.</li>
                <li>Staff will review the issue details and any intake photos.</li>
                <li>Future phases will add staff updates, closeout notes, and tenant notifications.</li>
              </ul>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/90 p-5">
              <p className="text-sm font-medium text-emerald-800">
                Submission protection is active
              </p>
              <p className="mt-2 text-sm leading-7 text-emerald-900/80">
                After a successful submit, this confirmation page replaces the
                form in browser history to reduce accidental repeat submissions.
              </p>
            </div>
          </div>
        </section>

        <section className="app-form-panel">
          <div className="app-note-info rounded-[1.75rem] p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
              Request Summary
            </p>
            <dl className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <dt className="text-slate-500">Unit</dt>
                <dd className="text-right font-medium text-slate-900">
                  {unit ?? "Not available"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <dt className="text-slate-500">Request ID</dt>
                <dd className="text-right font-medium text-blue-700">
                  {requestId ?? "Not available"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <dt className="text-slate-500">Current status</dt>
                <dd className="text-right font-medium text-slate-900">
                  {status ?? "Not available"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Photos uploaded</dt>
                <dd className="text-right font-medium text-slate-900">
                  {photoCount}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/submit-request"
              className="app-button-primary items-center justify-center"
            >
              Submit Another Request
            </Link>
            <Link
              href="/"
              className="app-button-secondary items-center justify-center"
            >
              Back Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
