import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { tenantMagicLinkSchema } from "@/lib/validation/tenant-auth";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  try {
    const payload = await request.json();
    const parsed = tenantMagicLinkSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message:
            parsed.error.issues[0]?.message ??
            "Please enter a valid tenant email address.",
        },
        { status: 400 }
      );
    }

    const redirectTo = new URL("/auth/callback?next=/tenant/requests", request.url);

    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email.trim().toLowerCase(),
      options: {
        emailRedirectTo: redirectTo.toString(),
        shouldCreateUser: true,
      },
    });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "Magic link sent. Check your email to access the tenant portal.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to send the tenant access link.",
      },
      { status: 500 }
    );
  }
}
