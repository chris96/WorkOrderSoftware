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
      className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-stone-500"
    >
      {isSigningOut ? "Signing Out..." : "Sign Out"}
    </button>
  );
}
