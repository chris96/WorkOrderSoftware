import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { workOrderRequestDataSchema } from "@/lib/validation/work-order-request";

const STORAGE_BUCKET = "work-order-photos";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export async function POST(request: Request) {
  const supabase = createAdminSupabaseClient();
  const uploadedStoragePaths: string[] = [];
  let workOrderId: string | null = null;

  try {
    const formData = await request.formData();
    const fileEntries = formData.getAll("photos");
    const files = fileEntries.filter((entry): entry is File => entry instanceof File);

    const parsedRequest = workOrderRequestDataSchema.safeParse({
      unit: formData.get("unit"),
      category: formData.get("category"),
      tenantName: formData.get("tenantName"),
      email: formData.get("email"),
      phone: formData.get("phone") ?? "",
      description: formData.get("description"),
      isEmergency: formData.get("isEmergency") === "true",
    });

    if (!parsedRequest.success) {
      return NextResponse.json(
        {
          ok: false,
          message: parsedRequest.error.issues[0]?.message ?? "Invalid request data.",
        },
        { status: 400 }
      );
    }

    const { data: unitRow, error: unitError } = await supabase
      .from("units")
      .select("id, unit_number")
      .eq("unit_number", parsedRequest.data.unit)
      .single();

    if (unitError || !unitRow) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "The selected unit could not be found. Please contact building management if this unit is missing.",
        },
        { status: 400 }
      );
    }

    const { data: createdWorkOrder, error: workOrderError } = await supabase
      .from("work_orders")
      .insert({
        unit_id: unitRow.id,
        tenant_name: parsedRequest.data.tenantName,
        tenant_email: parsedRequest.data.email,
        tenant_phone: parsedRequest.data.phone || null,
        category: parsedRequest.data.category,
        description: parsedRequest.data.description,
        is_emergency: parsedRequest.data.isEmergency,
      })
      .select("id, status")
      .single();

    if (workOrderError || !createdWorkOrder) {
      return NextResponse.json(
        {
          ok: false,
          message: workOrderError?.message ?? "Unable to create the work order.",
        },
        { status: 500 }
      );
    }

    workOrderId = createdWorkOrder.id;

    const uploadedPhotos: Array<{
      contentType: string;
      fileName: string;
      path: string;
      size: number;
    }> = [];

    for (const file of files) {
      const extension = file.name.includes(".")
        ? file.name.split(".").pop()
        : undefined;
      const safeName = sanitizeFileName(file.name);
      const uniqueFileName = extension
        ? `${randomUUID()}.${extension.toLowerCase()}`
        : `${randomUUID()}-${safeName}`;
      const storagePath = `intake/${workOrderId}/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      uploadedStoragePaths.push(storagePath);
      uploadedPhotos.push({
        contentType: file.type,
        fileName: safeName,
        path: storagePath,
        size: file.size,
      });
    }

    if (uploadedPhotos.length > 0) {
      const { error: photoInsertError } = await supabase
        .from("work_order_photos")
        .insert(
          uploadedPhotos.map((photo) => ({
            work_order_id: workOrderId,
            photo_type: "intake",
            storage_bucket: STORAGE_BUCKET,
            storage_path: photo.path,
            content_type: photo.contentType,
            file_size_bytes: photo.size,
          }))
        );

      if (photoInsertError) {
        throw new Error(photoInsertError.message);
      }
    }

    const { error: eventInsertError } = await supabase
      .from("work_order_events")
      .insert({
        work_order_id: workOrderId,
        event_type: "submitted",
        to_status: createdWorkOrder.status,
        metadata: {
          category: parsedRequest.data.category,
          isEmergency: parsedRequest.data.isEmergency,
          photoCount: uploadedPhotos.length,
          unitNumber: unitRow.unit_number,
        },
      });

    if (eventInsertError) {
      throw new Error(eventInsertError.message);
    }

    return NextResponse.json({
      ok: true,
      uploadedPhotos,
      workOrder: {
        id: workOrderId,
        status: createdWorkOrder.status,
        unitNumber: unitRow.unit_number,
      },
    });
  } catch (error) {
    if (uploadedStoragePaths.length > 0) {
      await supabase.storage.from(STORAGE_BUCKET).remove(uploadedStoragePaths);
    }

    if (workOrderId) {
      await supabase.from("work_orders").delete().eq("id", workOrderId);
    }

    const message =
      error instanceof Error ? error.message : "Unable to submit the request.";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 }
    );
  }
}
