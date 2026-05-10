import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/tenant/requests";
  const redirectUrl = new URL(next, request.url);

  if (!code) {
    return NextResponse.redirect(new URL("/tenant/sign-in?error=missing_code", request.url));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/tenant/sign-in?error=invalid_link", request.url));
  }

  return NextResponse.redirect(redirectUrl);
}
