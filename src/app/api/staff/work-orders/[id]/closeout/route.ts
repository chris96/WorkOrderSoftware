import { NextResponse } from "next/server";

import { deliverRepairReport } from "@/lib/reports/deliver-repair-report";
import { getOptionalStaffUser } from "@/lib/staff-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { closeoutSchema } from "@/lib/validation/staff-work-orders";
import { type WorkOrderStatus } from "@/lib/work-orders";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const MAX_CLOSEOUT_PHOTO_COUNT = 6;
const MAX_CLOSEOUT_PHOTO_BYTES = 10 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];

function buildCloseoutPath(workOrderId: string, file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const timestamp = Date.now();
  const randomPart = crypto.randomUUID();
  return `closeout/${workOrderId}/${timestamp}-${randomPart}-${safeName}`;
}

async function removeUploadedFiles(paths: string[]) {
  if (paths.length === 0) {
    return;
  }

  const supabase = createAdminSupabaseClient();
  await supabase.storage.from("work-order-photos").remove(paths);
}

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

  const uploadedPaths: string[] = [];
  let didUpdateWorkOrder = false;
  let previousStatus: WorkOrderStatus = "in_progress";

  try {
    const formData = await request.formData();
    const repairSummary = String(formData.get("repairSummary") ?? "");
    const materialsUsed = String(formData.get("materialsUsed") ?? "");
    const completionNotes = String(formData.get("completionNotes") ?? "");
    const parsed = closeoutSchema.safeParse({
      completionNotes,
      materialsUsed,
      repairSummary,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message:
            parsed.error.issues[0]?.message ?? "Closeout details are invalid.",
        },
        { status: 400 }
      );
    }

    const files = formData
      .getAll("photos")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (files.length > MAX_CLOSEOUT_PHOTO_COUNT) {
      return NextResponse.json(
        {
          ok: false,
          message: `Please upload no more than ${MAX_CLOSEOUT_PHOTO_COUNT} closeout photos.`,
        },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            ok: false,
            message: "Closeout photos must be JPG, PNG, or WEBP images.",
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_CLOSEOUT_PHOTO_BYTES) {
        return NextResponse.json(
          {
            ok: false,
            message: "Each closeout photo must be 10 MB or smaller.",
          },
          { status: 400 }
        );
      }
    }

    const { data: existingWorkOrder, error: existingWorkOrderError } = await supabase
      .from("work_orders")
      .select("id, status")
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

    if (existingWorkOrder.status === "closed") {
      return NextResponse.json(
        {
          ok: false,
          message: "This request is already closed.",
        },
        { status: 400 }
      );
    }

    previousStatus = existingWorkOrder.status as WorkOrderStatus;

    const uploadedPhotos: Array<{
      contentType: string;
      fileSizeBytes: number;
      storagePath: string;
    }> = [];

    for (const file of files) {
      const storagePath = buildCloseoutPath(id, file);
      const { error: uploadError } = await supabase.storage
        .from("work-order-photos")
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        await removeUploadedFiles(uploadedPaths);

        return NextResponse.json(
          {
            ok: false,
            message: uploadError.message,
          },
          { status: 500 }
        );
      }

      uploadedPaths.push(storagePath);
      uploadedPhotos.push({
        contentType: file.type,
        fileSizeBytes: file.size,
        storagePath,
      });
    }

    const closedAt = new Date().toISOString();
    const { error: workOrderUpdateError } = await supabase
      .from("work_orders")
      .update({
        closed_at: closedAt,
        closed_by_user_id: staffUser.id,
        closeout_internal_notes: parsed.data.completionNotes || null,
        materials_used: parsed.data.materialsUsed || null,
        repair_summary: parsed.data.repairSummary,
        status: "closed" as WorkOrderStatus,
      })
      .eq("id", id)
      .neq("status", "closed");

    if (workOrderUpdateError) {
      await removeUploadedFiles(uploadedPaths);

      return NextResponse.json(
        {
          ok: false,
          message: workOrderUpdateError.message,
        },
        { status: 500 }
      );
    }

    didUpdateWorkOrder = true;

    if (uploadedPhotos.length > 0) {
      const { error: photoInsertError } = await supabase
        .from("work_order_photos")
        .insert(
          uploadedPhotos.map((photo) => ({
            content_type: photo.contentType,
            file_size_bytes: photo.fileSizeBytes,
            photo_type: "closeout",
            storage_bucket: "work-order-photos",
            storage_path: photo.storagePath,
            uploaded_by_user_id: staffUser.id,
            work_order_id: id,
          }))
        );

      if (photoInsertError) {
        await supabase
          .from("work_orders")
          .update({
            closed_at: null,
            closed_by_user_id: null,
            closeout_internal_notes: null,
            materials_used: null,
            repair_summary: null,
            status: previousStatus,
          })
          .eq("id", id);
        await removeUploadedFiles(uploadedPaths);

        return NextResponse.json(
          {
            ok: false,
            message: photoInsertError.message,
          },
          { status: 500 }
        );
      }
    }

    const { error: eventInsertError } = await supabase.from("work_order_events").insert({
      actor_user_id: staffUser.id,
      event_type: "closed",
      from_status: existingWorkOrder.status as WorkOrderStatus,
      metadata: {
        action: "closeout_completed",
        closedByName: staffUser.fullName,
        closeoutPhotoCount: uploadedPhotos.length,
        hasInternalCompletionNotes: Boolean(parsed.data.completionNotes),
        materialsUsedProvided: Boolean(parsed.data.materialsUsed),
      },
      note: parsed.data.repairSummary,
      to_status: "closed",
      work_order_id: id,
    });

    if (eventInsertError) {
      await supabase
        .from("work_orders")
        .update({
          closed_at: null,
          closed_by_user_id: null,
          closeout_internal_notes: null,
          materials_used: null,
          repair_summary: null,
          status: previousStatus,
        })
        .eq("id", id);

      if (uploadedPhotos.length > 0) {
        await supabase.from("work_order_photos").delete().eq("work_order_id", id).eq(
          "photo_type",
          "closeout"
        );
      }

      await removeUploadedFiles(uploadedPaths);

      return NextResponse.json(
        {
          ok: false,
          message: eventInsertError.message,
        },
        { status: 500 }
      );
    }

    const reportDelivery = await deliverRepairReport(id);

    return NextResponse.json({
      ok: true,
      message: reportDelivery.ok
        ? "Repair closed out successfully. The tenant completion email has been sent."
        : "Repair closed out successfully, but the tenant completion email did not send. Staff follow-up is still required.",
      reportDelivery,
    });
  } catch (error) {
    if (didUpdateWorkOrder) {
      await supabase
        .from("work_orders")
        .update({
          closed_at: null,
          closed_by_user_id: null,
          closeout_internal_notes: null,
          materials_used: null,
          repair_summary: null,
          status: previousStatus,
        })
        .eq("id", id);
    }

    await removeUploadedFiles(uploadedPaths);

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Unable to complete the repair closeout.",
      },
      { status: 500 }
    );
  }
}
