import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/env";

export async function GET() {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.json(
      {
        configured: false,
        ok: false,
        message:
          "Supabase environment variables are missing. Populate .env.local and Vercel environment variables before testing connectivity.",
      },
      { status: 500 }
    );
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from("units").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        {
          configured: true,
          ok: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      configured: true,
      ok: true,
      message: "Supabase connection is healthy.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Supabase error";

    return NextResponse.json(
      {
        configured: false,
        ok: false,
        message,
      },
      { status: 500 }
    );
  }
}
