import { NextResponse } from "next/server";

import { getTenantOwnedWorkOrder } from "@/lib/tenant-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    workOrderId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { workOrderId } = await context.params;
  const ownedWorkOrder = await getTenantOwnedWorkOrder(workOrderId);

  if (!ownedWorkOrder) {
    return NextResponse.redirect(new URL("/tenant/sign-in", request.url));
  }

  const supabase = createAdminSupabaseClient();
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("storage_bucket, storage_path, generated_at")
    .eq("work_order_id", workOrderId)
    .maybeSingle();

  if (reportError) {
    return NextResponse.redirect(
      new URL(`/tenant/requests/${workOrderId}?report=lookup_error`, request.url)
    );
  }

  if (!report?.storage_bucket || !report?.storage_path || !report.generated_at) {
    return NextResponse.redirect(
      new URL(`/tenant/requests/${workOrderId}?report=not_ready`, request.url)
    );
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(report.storage_bucket)
    .createSignedUrl(report.storage_path, 60 * 30);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    return NextResponse.redirect(
      new URL(`/tenant/requests/${workOrderId}?report=access_error`, request.url)
    );
  }

  return NextResponse.redirect(signedUrlData.signedUrl);
}
