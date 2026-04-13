import { WorkOrderCompletionEmail } from "@/emails/work-order-completion";
import { getEmailEnv } from "@/lib/env";
import { createRepairReportPdfBuffer } from "@/lib/reports/report-storage";
import { createResendClient } from "@/lib/resend";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export type ReportDeliveryResult =
  | {
      ok: true;
      deliveryStatus: "sent";
      reportPath: string;
    }
  | {
      ok: false;
      deliveryStatus: "failed";
      error: string;
      reportPath: string;
    };

const REPORTS_BUCKET = "repair-reports";
const REPORT_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

export async function deliverRepairReport(
  workOrderId: string
): Promise<ReportDeliveryResult> {
  const supabase = createAdminSupabaseClient();
  const reportPath = `${workOrderId}/repair-report.pdf`;

  const markFailed = async (errorMessage: string) => {
    await supabase.from("reports").upsert(
      {
        delivery_status: "failed",
        email_message_id: null,
        last_error: errorMessage,
        storage_bucket: REPORTS_BUCKET,
        storage_path: reportPath,
        work_order_id: workOrderId,
      },
      {
        onConflict: "work_order_id",
      }
    );
  };

  try {
    await supabase.from("reports").upsert(
      {
        delivered_at: null,
        delivery_status: "pending",
        email_message_id: null,
        last_error: null,
        storage_bucket: REPORTS_BUCKET,
        storage_path: reportPath,
        work_order_id: workOrderId,
      },
      {
        onConflict: "work_order_id",
      }
    );

    const { payload, pdfBuffer } = await createRepairReportPdfBuffer(workOrderId);
    const generatedAt = new Date().toISOString();

    const { error: uploadError } = await supabase.storage
      .from(REPORTS_BUCKET)
      .upload(reportPath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { error: reportUpdateError } = await supabase.from("reports").upsert(
      {
        delivery_status: "pending",
        generated_at: generatedAt,
        last_error: null,
        storage_bucket: REPORTS_BUCKET,
        storage_path: reportPath,
        work_order_id: workOrderId,
      },
      {
        onConflict: "work_order_id",
      }
    );

    if (reportUpdateError) {
      throw new Error(reportUpdateError.message);
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(REPORTS_BUCKET)
      .createSignedUrl(reportPath, REPORT_SIGNED_URL_TTL_SECONDS);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error(
        signedUrlError?.message ||
          "Tenant report link could not be prepared for delivery."
      );
    }

    const { resendFromEmail, resendReplyToEmail } = getEmailEnv();
    const resend = createResendClient();
    const { data: emailData, error: emailError } = await resend.emails.send(
      {
        from: resendFromEmail,
        react: WorkOrderCompletionEmail({
          closeoutDateLabel: payload.closeoutDateLabel,
          repairSummary: payload.repairSummary,
          reportUrl: signedUrlData.signedUrl,
          tenantName: payload.tenant.name,
          unitNumber: payload.unitNumber,
          workOrderId: payload.workOrderId,
        }),
        replyTo: resendReplyToEmail ? [resendReplyToEmail] : undefined,
        subject: `Repair completed for unit ${payload.unitNumber}`,
        to: payload.tenant.email,
      },
      {
        headers: {
          "Idempotency-Key": `completion-email-${payload.workOrderId}-${payload.closeoutDate}`,
        },
      }
    );

    if (emailError) {
      throw new Error(emailError.message);
    }

    const deliveredAt = new Date().toISOString();
    const { error: deliveryUpdateError } = await supabase.from("reports").update({
      delivered_at: deliveredAt,
      delivery_status: "sent",
      email_message_id: emailData?.id ?? null,
      last_error: null,
    }).eq("work_order_id", workOrderId);

    if (deliveryUpdateError) {
      throw new Error(deliveryUpdateError.message);
    }

    return {
      ok: true,
      deliveryStatus: "sent",
      reportPath,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Repair report delivery failed.";

    await markFailed(errorMessage);

    return {
      ok: false,
      deliveryStatus: "failed",
      error: errorMessage,
      reportPath,
    };
  }
}
