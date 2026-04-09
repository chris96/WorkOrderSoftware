import { renderToStream } from "@react-pdf/renderer";
import { Readable } from "node:stream";

import { RepairReportDocument } from "@/lib/reports/repair-report-document";
import type { RepairReportPayload } from "@/lib/reports/get-repair-report-payload";

async function streamToBuffer(stream: Readable) {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

export async function generateRepairReportPdfBuffer(payload: RepairReportPayload) {
  const stream = (await renderToStream(
    RepairReportDocument({ payload })
  )) as unknown as Readable;

  return streamToBuffer(stream);
}
