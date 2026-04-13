import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { formatWorkOrderDateTime, type WorkOrderStatus } from "@/lib/work-orders";

type ReportWorkOrderRow = {
  category: string;
  closed_at: string | null;
  closed_by_user_id: string | null;
  description: string;
  id: string;
  is_emergency: boolean;
  materials_used: string | null;
  repair_summary: string | null;
  status: WorkOrderStatus;
  submitted_at: string;
  tenant_email: string;
  tenant_name: string;
  tenant_phone: string | null;
  unit_id: string | null;
};

type ReportPhotoRow = {
  content_type: string | null;
  created_at: string;
  photo_type: "intake" | "closeout";
  storage_bucket: string;
  storage_path: string;
};

export type RepairReportPayload = {
  closeoutDate: string;
  closeoutDateLabel: string;
  closeoutPhotos: Array<{
    contentType: string | null;
    createdAt: string;
    label: string;
    signedUrl: string | null;
  }>;
  closedByName: string | null;
  emergencyLabel: string;
  materialsUsed: string | null;
  originalRequest: {
    category: string;
    description: string;
    submittedAt: string;
    submittedAtLabel: string;
  };
  repairSummary: string;
  tenant: {
    email: string;
    name: string;
    phone: string | null;
  };
  unitNumber: string;
  workOrderId: string;
};

export async function getRepairReportPayload(workOrderId: string) {
  const supabase = createAdminSupabaseClient();

  const [{ data: workOrder, error: workOrderError }, { data: photos, error: photosError }] =
    await Promise.all([
      supabase
        .from("work_orders")
        .select(
          "id, unit_id, tenant_name, tenant_email, tenant_phone, category, description, status, is_emergency, submitted_at, closed_at, closed_by_user_id, repair_summary, materials_used"
        )
        .eq("id", workOrderId)
        .single(),
      supabase
        .from("work_order_photos")
        .select("storage_bucket, storage_path, content_type, created_at, photo_type")
        .eq("work_order_id", workOrderId)
        .order("created_at", { ascending: true }),
    ]);

  if (workOrderError || !workOrder) {
    throw new Error("Work order could not be found for report generation.");
  }

  if (photosError) {
    throw new Error("Closeout photos could not be loaded for report generation.");
  }

  const reportWorkOrder = workOrder as ReportWorkOrderRow;

  if (reportWorkOrder.status !== "closed" || !reportWorkOrder.closed_at) {
    throw new Error("Repair reports can only be generated for closed work orders.");
  }

  if (!reportWorkOrder.repair_summary) {
    throw new Error("Repair summary is required before generating a report.");
  }

  let unitNumber = "Unknown unit";

  if (reportWorkOrder.unit_id) {
    const { data: unit, error: unitError } = await supabase
      .from("units")
      .select("unit_number")
      .eq("id", reportWorkOrder.unit_id)
      .single();

    if (unitError) {
      throw new Error("Unit information could not be loaded for report generation.");
    }

    unitNumber = unit?.unit_number ?? unitNumber;
  }

  let closedByName: string | null = null;

  if (reportWorkOrder.closed_by_user_id) {
    const { data: closer, error: closerError } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", reportWorkOrder.closed_by_user_id)
      .single();

    if (closerError) {
      throw new Error("Closing staff information could not be loaded for report generation.");
    }

    closedByName = closer?.full_name ?? null;
  }

  const reportPhotos = (photos ?? []) as ReportPhotoRow[];
  const closeoutPhotos = reportPhotos.filter((photo) => photo.photo_type === "closeout");

  const closeoutPhotosWithUrls = await Promise.all(
    closeoutPhotos.map(async (photo, index) => {
      const { data, error } = await supabase.storage
        .from(photo.storage_bucket)
        .createSignedUrl(photo.storage_path, 60 * 60);

      if (error) {
        throw new Error("Closeout photo access could not be prepared for report generation.");
      }

      return {
        contentType: photo.content_type,
        createdAt: photo.created_at,
        label: `Closeout photo ${index + 1}`,
        signedUrl: data?.signedUrl ?? null,
      };
    })
  );

  return {
    closeoutDate: reportWorkOrder.closed_at,
    closeoutDateLabel: formatWorkOrderDateTime(reportWorkOrder.closed_at),
    closeoutPhotos: closeoutPhotosWithUrls,
    closedByName,
    emergencyLabel: reportWorkOrder.is_emergency ? "Emergency" : "Standard",
    materialsUsed: reportWorkOrder.materials_used,
    originalRequest: {
      category: reportWorkOrder.category,
      description: reportWorkOrder.description,
      submittedAt: reportWorkOrder.submitted_at,
      submittedAtLabel: formatWorkOrderDateTime(reportWorkOrder.submitted_at),
    },
    repairSummary: reportWorkOrder.repair_summary,
    tenant: {
      email: reportWorkOrder.tenant_email,
      name: reportWorkOrder.tenant_name,
      phone: reportWorkOrder.tenant_phone,
    },
    unitNumber,
    workOrderId: reportWorkOrder.id,
  } satisfies RepairReportPayload;
}
