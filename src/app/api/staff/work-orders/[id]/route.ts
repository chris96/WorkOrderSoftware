import { NextResponse } from "next/server";

import { getOptionalStaffUser } from "@/lib/staff-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { type WorkOrderStatus } from "@/lib/work-orders";
import { workOrderUpdateSchema } from "@/lib/validation/staff-work-orders";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function buildAssignmentNoteMessage(assignedUserName: string | null) {
  if (!assignedUserName) {
    return "Work order was unassigned.";
  }

  return `Work order assigned to ${assignedUserName}.`;
}

export async function PATCH(request: Request, context: RouteContext) {
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
    const parsed = workOrderUpdateSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message:
            parsed.error.issues[0]?.message ?? "Invalid work order update.",
        },
        { status: 400 }
      );
    }

    const { data: existingWorkOrder, error: existingWorkOrderError } =
      await supabase
        .from("work_orders")
        .select("id, status, assigned_user_id")
        .eq("id", id)
        .single();

    if (existingWorkOrderError || !existingWorkOrder) {
      return NextResponse.json(
        {
          ok: false,
          message: "Work order could not be found.",
        },
        { status: 404 }
      );
    }

    let assignedUserName: string | null = null;

    if (parsed.data.assignedUserId) {
      const { data: assignedUser, error: assignedUserError } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("id", parsed.data.assignedUserId)
        .eq("is_active", true)
        .in("role", ["super", "backup"])
        .single();

      if (assignedUserError || !assignedUser) {
        return NextResponse.json(
          {
            ok: false,
            message: "The selected staff assignment is invalid.",
          },
          { status: 400 }
        );
      }

      assignedUserName = assignedUser.full_name;
    }

    const nextStatus = parsed.data.status;
    const nextAssignedUserId = parsed.data.assignedUserId;

    if (nextStatus === "closed" && existingWorkOrder.status !== "closed") {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Use the closeout workflow to close a request with the required repair summary.",
        },
        { status: 400 }
      );
    }

    const statusChanged = existingWorkOrder.status !== nextStatus;
    const assignmentChanged =
      (existingWorkOrder.assigned_user_id ?? null) !== (nextAssignedUserId ?? null);

    if (!statusChanged && !assignmentChanged) {
      return NextResponse.json({
        ok: true,
        message: "No changes were needed.",
      });
    }

    const updatePayload: {
      assigned_user_id: string | null;
      closed_at?: string | null;
      status: WorkOrderStatus;
    } = {
      assigned_user_id: nextAssignedUserId,
      status: nextStatus,
    };

    if (statusChanged) {
      updatePayload.closed_at =
        nextStatus === "closed" ? new Date().toISOString() : null;
    }

    const { error: updateError } = await supabase
      .from("work_orders")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        {
          ok: false,
          message: updateError.message,
        },
        { status: 500 }
      );
    }

    const eventInserts: Array<{
      actor_user_id: string;
      event_type: "note_added" | "status_changed";
      from_status?: WorkOrderStatus;
      metadata: Record<string, string | boolean | null>;
      note?: string;
      to_status?: WorkOrderStatus;
      work_order_id: string;
    }> = [];

    if (statusChanged) {
      eventInserts.push({
        actor_user_id: staffUser.id,
        event_type: "status_changed",
        from_status: existingWorkOrder.status as WorkOrderStatus,
        metadata: {
          action: "status_changed",
        },
        to_status: nextStatus,
        work_order_id: id,
      });
    }

    if (assignmentChanged) {
      eventInserts.push({
        actor_user_id: staffUser.id,
        event_type: "note_added",
        metadata: {
          action: "assignment_changed",
          assignedUserId: nextAssignedUserId,
          assignedUserName,
          isInternal: true,
        },
        note: buildAssignmentNoteMessage(assignedUserName),
        work_order_id: id,
      });
    }

    if (eventInserts.length > 0) {
      const { error: eventInsertError } = await supabase
        .from("work_order_events")
        .insert(eventInserts);

      if (eventInsertError) {
        return NextResponse.json(
          {
            ok: false,
            message: eventInsertError.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Work order updated successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to update the work order.",
      },
      { status: 500 }
    );
  }
}
