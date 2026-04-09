import { NextResponse } from "next/server";

import { getOptionalStaffUser } from "@/lib/staff-auth";
import { generateRepairReportPdfBuffer } from "@/lib/reports/generate-repair-report-pdf";
import { getRepairReportPayload } from "@/lib/reports/get-repair-report-payload";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext) {
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
    const payload = await getRepairReportPayload(id);
    const pdfBuffer = await generateRepairReportPdfBuffer(payload);
    const storageBucket = "repair-reports";
    const storagePath = `${payload.workOrderId}/repair-report.pdf`;
    const generatedAt = new Date().toISOString();

    const { error: uploadError } = await supabase.storage
      .from(storageBucket)
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          ok: false,
          message: uploadError.message,
        },
        { status: 500 }
      );
    }

    const { error: reportUpsertError } = await supabase.from("reports").upsert(
      {
        delivery_status: "pending",
        generated_at: generatedAt,
        storage_bucket: storageBucket,
        storage_path: storagePath,
        work_order_id: payload.workOrderId,
      },
      {
        onConflict: "work_order_id",
      }
    );

    if (reportUpsertError) {
      return NextResponse.json(
        {
          ok: false,
          message: reportUpsertError.message,
        },
        { status: 500 }
      );
    }

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Disposition": `inline; filename=\"repair-report-${payload.workOrderId}.pdf\"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to generate the repair report preview.",
      },
      { status: 500 }
    );
  }
}
