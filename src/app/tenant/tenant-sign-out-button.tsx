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
      className="app-button-secondary"
    >
      {isSigningOut ? "Signing Out..." : "Sign Out"}
    </button>
  );
}
