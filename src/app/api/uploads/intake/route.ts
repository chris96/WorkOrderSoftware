import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/server";

const STORAGE_BUCKET = "work-order-photos";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileEntries = formData.getAll("photos");
    const files = fileEntries.filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { ok: false, message: "No photos were included in the upload request." },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
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
      const storagePath = `intake/${uniqueFileName}`;

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        return NextResponse.json(
          { ok: false, message: error.message },
          { status: 500 }
        );
      }

      uploadedPhotos.push({
        contentType: file.type,
        fileName: safeName,
        path: storagePath,
        size: file.size,
      });
    }

    return NextResponse.json({
      ok: true,
      photos: uploadedPhotos,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown upload error";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 }
    );
  }
}
