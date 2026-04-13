import { NextResponse } from "next/server";

import { getOptionalStaffUser } from "@/lib/staff-auth";
import { createRepairReportPdfBuffer } from "@/lib/reports/report-storage";

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
    const { payload, pdfBuffer } = await createRepairReportPdfBuffer(id);
    const pdfBytes = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfBytes, {
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
