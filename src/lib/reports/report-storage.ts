import { generateRepairReportPdfBuffer } from "@/lib/reports/generate-repair-report-pdf";
import {
  getRepairReportPayload,
  type RepairReportPayload,
} from "@/lib/reports/get-repair-report-payload";

export async function createRepairReportPdfBuffer(workOrderId: string): Promise<{
  payload: RepairReportPayload;
  pdfBuffer: Buffer;
}> {
  const payload = await getRepairReportPayload(workOrderId);
  const pdfBuffer = await generateRepairReportPdfBuffer(payload);

  return {
    payload,
    pdfBuffer,
  };
}
