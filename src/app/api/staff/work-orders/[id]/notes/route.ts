import { NextResponse } from "next/server";

import { getOptionalStaffUser } from "@/lib/staff-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { internalNoteSchema } from "@/lib/validation/staff-work-orders";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const staffUser = await getOptionalStaffUser();

  if (!staffUser) {
    return NextResponse.json(
      {
        ok: false,
        message: "Staff authentication is required.",
      },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const supabase = createAdminSupabaseClient();

  try {
    const payload = await request.json();
    const parsed = internalNoteSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message: parsed.error.issues[0]?.message ?? "Invalid internal note.",
        },
        { status: 400 }
      );
    }

    const { data: workOrder, error: workOrderError } = await supabase
      .from("work_orders")
      .select("id")
      .eq("id", id)
      .single();

    if (workOrderError || !workOrder) {
      return NextResponse.json(
        {
          ok: false,
          message: "Work order could not be found.",
        },
        { status: 404 }
      );
    }

    const { error: noteInsertError } = await supabase
      .from("work_order_events")
      .insert({
        actor_user_id: staffUser.id,
        event_type: "note_added",
        metadata: {
          action: "internal_note",
          isInternal: true,
        },
        note: parsed.data.note,
        work_order_id: id,
      });

    if (noteInsertError) {
      return NextResponse.json(
        {
          ok: false,
          message: noteInsertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Internal note saved.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to save the internal note.",
      },
      { status: 500 }
    );
  }
}
