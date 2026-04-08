import { NextResponse } from "next/server";

import { getStaffBootstrapEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { staffBootstrapSchema } from "@/lib/validation/staff-bootstrap";

export async function POST(request: Request) {
  const supabase = createAdminSupabaseClient();
  const { bootstrapKey } = getStaffBootstrapEnv();

  try {
    const payload = await request.json();
    const parsedRequest = staffBootstrapSchema.safeParse(payload);

    if (!parsedRequest.success) {
      return NextResponse.json(
        {
          ok: false,
          message:
            parsedRequest.error.issues[0]?.message ??
            "Invalid staff bootstrap request.",
        },
        { status: 400 }
      );
    }

    if (parsedRequest.data.bootstrapKey !== bootstrapKey) {
      return NextResponse.json(
        {
          ok: false,
          message: "The bootstrap key is invalid.",
        },
        { status: 403 }
      );
    }

    const normalizedEmail = parsedRequest.data.email.trim().toLowerCase();
    const fullName = parsedRequest.data.fullName.trim();

    const { data: existingStaffUser } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingStaffUser) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "A staff user with this email already exists. Use a different address or sign in with the existing account.",
        },
        { status: 409 }
      );
    }

    const { data: createdAuthUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: parsedRequest.data.password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: parsedRequest.data.role,
        },
      });

    if (authError || !createdAuthUser.user) {
      return NextResponse.json(
        {
          ok: false,
          message: authError?.message ?? "Unable to create the staff auth user.",
        },
        { status: 500 }
      );
    }

    const { error: insertUserError } = await supabase.from("users").insert({
      id: createdAuthUser.user.id,
      email: normalizedEmail,
      full_name: fullName,
      role: parsedRequest.data.role,
      is_active: true,
    });

    if (insertUserError) {
      await supabase.auth.admin.deleteUser(createdAuthUser.user.id);

      return NextResponse.json(
        {
          ok: false,
          message:
            insertUserError.message ??
            "Unable to create the application staff record.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      staffUser: {
        email: normalizedEmail,
        fullName,
        role: parsedRequest.data.role,
      },
      message:
        "Staff user created successfully. This account can be used in the upcoming staff sign-in flow.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Staff bootstrap failed unexpectedly.",
      },
      { status: 500 }
    );
  }
}
