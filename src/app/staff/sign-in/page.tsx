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
      <div className="mx-auto grid w-full max-w-6xl gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/6 p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
            Staff Sign-In
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Access the staff portal.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-stone-300 md:text-lg">
            Staff sign-in is now the gate into the dashboard work. Use the
            bootstrap flow first if the super and backup accounts have not been
            created yet.
          </p>

          <div className="mt-10 space-y-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <h2 className="text-sm uppercase tracking-[0.24em] text-stone-400">
                Staff access in this phase
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-300">
                <li>Sign in with the staff credentials created during bootstrap</li>
                <li>Staff routes are protected at the route and page level</li>
                <li>Dashboard buildout comes next on top of this auth foundation</li>
              </ul>
            </div>
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5"
          >
            Back Home
          </Link>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-stone-950/70 p-6 shadow-2xl shadow-black/40 backdrop-blur md:p-8">
          <SignInForm initialMessage={message} />
        </section>
      </div>
    </main>
  );
}
