import Link from "next/link";

import { requireStaffUser } from "@/lib/staff-auth";

import { StaffSignOutButton } from "./staff-sign-out-button";

export default async function StaffPage() {
  const staffUser = await requireStaffUser();

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
          Staff Portal
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
          Signed in as {staffUser.fullName}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-300">
          This is the protected entry point for the staff dashboard. Phase 3 now
          has real staff sign-in in place, and the next build step is the
          dashboard itself for reviewing, assigning, and updating work orders.
        </p>
        <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-stone-300">
          <p>
            Role: <span className="text-amber-200">{staffUser.role}</span>
          </p>
          <p>
            Email: <span className="text-amber-200">{staffUser.email}</span>
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/staff/bootstrap"
            className="inline-flex rounded-full bg-amber-300 px-5 py-3 text-sm font-medium text-stone-950 transition hover:bg-amber-200"
          >
            Bootstrap Staff Users
          </Link>
          <StaffSignOutButton />
          <Link
            href="/"
            className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5"
          >
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
