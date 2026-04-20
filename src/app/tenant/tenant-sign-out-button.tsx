"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function TenantSignOutButton() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/tenant/sign-in");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
    >
      {isSigningOut ? "Signing Out..." : "Sign Out"}
    </button>
  );
}
