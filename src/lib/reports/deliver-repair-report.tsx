import { WorkOrderCompletionEmail } from "@/emails/work-order-completion";
import { getEmailEnv } from "@/lib/env";
import { createRepairReportPdfBuffer } from "@/lib/reports/report-storage";
import { createResendClient } from "@/lib/resend";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

type DeliveryAction = "closeout" | "regenerate" | "resend";

export type ReportDeliveryResult =
  | {
      action: DeliveryAction;
      didRegenerate: boolean;
      emailMessageId: string | null;
      ok: true;
      deliveryStatus: "sent";
      reportPath: string;
    }
  | {
      action: DeliveryAction;
      didRegenerate: boolean;
      ok: false;
      deliveryStatus: "failed";
      error: string;
      reportPath: string;
    };

type ReportRow = {
  generated_at: string | null;
  storage_bucket: string;
  storage_path: string;
};

const REPORTS_BUCKET = "repair-reports";
const REPORT_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

export async function deliverRepairReport(
  workOrderId: string,
  options?: {
    action?: DeliveryAction;
  }
): Promise<ReportDeliveryResult> {
  const supabase = createAdminSupabaseClient();
  const action = options?.action ?? "closeout";
  const defaultReportPath = `${workOrderId}/repair-report.pdf`;
  let didRegenerate = false;

  const markFailed = async (reportPath: string, errorMessage: string) => {
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
    const { data: existingReport } = await supabase
      .from("reports")
      .select("storage_bucket, storage_path, generated_at")
      .eq("work_order_id", workOrderId)
      .maybeSingle();

    const existingReportRow = existingReport as ReportRow | null;
    const reportPath = existingReportRow?.storage_path || defaultReportPath;

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
    const shouldRegenerate =
      action === "closeout" ||
      action === "regenerate" ||
      !existingReportRow?.generated_at;

    if (shouldRegenerate) {
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

      didRegenerate = true;
    }

    let signedUrlResult = await supabase.storage
      .from(REPORTS_BUCKET)
      .createSignedUrl(reportPath, REPORT_SIGNED_URL_TTL_SECONDS);

    if (
      (signedUrlResult.error || !signedUrlResult.data?.signedUrl) &&
      !didRegenerate
    ) {
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

      didRegenerate = true;
      signedUrlResult = await supabase.storage
        .from(REPORTS_BUCKET)
        .createSignedUrl(reportPath, REPORT_SIGNED_URL_TTL_SECONDS);
    }

    if (signedUrlResult.error || !signedUrlResult.data?.signedUrl) {
      throw new Error(
        signedUrlResult.error?.message ||
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
          reportUrl: signedUrlResult.data.signedUrl,
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
          "Idempotency-Key":
            action === "closeout"
              ? `completion-email-${payload.workOrderId}-${payload.closeoutDate}`
              : `${action}-completion-email-${payload.workOrderId}-${Date.now()}`,
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
      action,
      didRegenerate,
      emailMessageId: emailData?.id ?? null,
      ok: true,
      deliveryStatus: "sent",
      reportPath,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Repair report delivery failed.";
    const reportPath = defaultReportPath;

    await markFailed(reportPath, errorMessage);

    return {
      action,
      didRegenerate,
      ok: false,
      deliveryStatus: "failed",
      error: errorMessage,
      reportPath,
    };
  }
}
