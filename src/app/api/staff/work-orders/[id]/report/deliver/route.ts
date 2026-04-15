import { NextResponse } from "next/server";
import { z } from "zod";

import { deliverRepairReport } from "@/lib/reports/deliver-repair-report";
import { getOptionalStaffUser } from "@/lib/staff-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const requestSchema = z.object({
  action: z.enum(["regenerate", "resend"]),
});

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
    const parsed = requestSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message:
            parsed.error.issues[0]?.message ?? "Invalid report delivery request.",
        },
        { status: 400 }
      );
    }

    const { data: workOrder, error: workOrderError } = await supabase
      .from("work_orders")
      .select("id, status")
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

    if (workOrder.status !== "closed") {
      return NextResponse.json(
        {
          ok: false,
          message: "Reports can only be delivered for closed work orders.",
        },
        { status: 400 }
      );
    }

    const result = await deliverRepairReport(id, {
      action: parsed.data.action,
    });

    await supabase.from("work_order_events").insert({
      actor_user_id: staffUser.id,
      event_type: "note_added",
      metadata: {
        action:
          parsed.data.action === "regenerate"
            ? "report_regenerated"
            : "completion_email_resent",
        deliveryStatus: result.deliveryStatus,
        didRegenerate: result.didRegenerate,
        emailMessageId: "emailMessageId" in result ? result.emailMessageId : null,
        isInternal: true,
      },
      note: result.ok
        ? parsed.data.action === "regenerate"
          ? "Staff regenerated the repair report and resent the tenant completion email."
          : "Staff resent the tenant completion email."
        : parsed.data.action === "regenerate"
          ? "Staff attempted to regenerate the repair report, but delivery failed."
          : "Staff attempted to resend the tenant completion email, but delivery failed.",
      work_order_id: id,
    });

    return NextResponse.json({
      ok: result.ok,
      message: result.ok
        ? parsed.data.action === "regenerate"
          ? "Repair report regenerated and tenant completion email sent."
          : "Tenant completion email sent again."
        : result.error,
      reportDelivery: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to deliver the repair report.",
      },
      { status: 500 }
    );
  }
}
