import { NextResponse } from "next/server";

import { getOptionalStaffUser } from "@/lib/staff-auth";
import { generateRepairReportPdfBuffer } from "@/lib/reports/generate-repair-report-pdf";
import { getRepairReportPayload } from "@/lib/reports/get-repair-report-payload";

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

  try {
    const payload = await getRepairReportPayload(id);
    const pdfBuffer = await generateRepairReportPdfBuffer(payload);

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
