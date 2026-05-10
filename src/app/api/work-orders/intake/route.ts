import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { workOrderRequestDataSchema } from "@/lib/validation/work-order-request";

const STORAGE_BUCKET = "work-order-photos";
const DUPLICATE_WINDOW_MINUTES = 10;
const PHOTO_UPLOAD_CONCURRENCY = 4;

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

async function mapWithConcurrency<T, TResult>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<TResult>
) {
  const results = new Array<TResult>(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex]!, currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker())
  );

  return results;
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

    const normalizedRequest = {
      ...parsedRequest.data,
      email: parsedRequest.data.email.trim().toLowerCase(),
      phone: parsedRequest.data.phone.trim(),
    };

    const { data: unitRow, error: unitError } = await supabase
      .from("units")
      .select("id, unit_number")
      .eq("unit_number", normalizedRequest.unit)
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

    const duplicateWindowStart = new Date(
      Date.now() - DUPLICATE_WINDOW_MINUTES * 60 * 1000
    ).toISOString();

    const { data: recentDuplicate } = await supabase
      .from("work_orders")
      .select("id, status")
      .eq("unit_id", unitRow.id)
      .eq("tenant_name", normalizedRequest.tenantName)
      .eq("tenant_email", normalizedRequest.email)
      .eq("category", normalizedRequest.category)
      .eq("description", normalizedRequest.description)
      .eq("is_emergency", normalizedRequest.isEmergency)
      .gte("created_at", duplicateWindowStart)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentDuplicate) {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        message:
          "This request was already submitted recently, so we kept the original work order instead of creating a duplicate.",
        uploadedPhotos: [],
        workOrder: {
          id: recentDuplicate.id,
          status: recentDuplicate.status,
          unitNumber: unitRow.unit_number,
        },
      });
    }

    const { data: createdWorkOrder, error: workOrderError } = await supabase
      .from("work_orders")
      .insert({
        unit_id: unitRow.id,
        tenant_name: normalizedRequest.tenantName,
        tenant_email: normalizedRequest.email,
        tenant_phone: normalizedRequest.phone || null,
        category: normalizedRequest.category,
        description: normalizedRequest.description,
        is_emergency: normalizedRequest.isEmergency,
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

    const uploadedPhotos = await mapWithConcurrency(
      files,
      PHOTO_UPLOAD_CONCURRENCY,
      async (file) => {
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
        return {
          contentType: file.type,
          fileName: safeName,
          path: storagePath,
          size: file.size,
        };
      }
    );

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
          category: normalizedRequest.category,
          isEmergency: normalizedRequest.isEmergency,
          photoCount: uploadedPhotos.length,
          unitNumber: unitRow.unit_number,
        },
      });

    if (eventInsertError) {
      throw new Error(eventInsertError.message);
    }

    return NextResponse.json({
      ok: true,
      duplicate: false,
      message:
        uploadedPhotos.length > 0
          ? "Your request was saved and the intake photos were uploaded."
          : "Your request was saved successfully.",
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
