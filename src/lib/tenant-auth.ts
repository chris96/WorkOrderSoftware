import { redirect } from "next/navigation";

import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";

export type TenantUser = {
  email: string;
  id: string;
};

export type TenantWorkOrderSummary = {
  category: string;
  closed_at: string | null;
  id: string;
  is_emergency: boolean;
  report_generated_at: string | null;
  status: string;
  submitted_at: string;
  tenant_email: string;
};

type TenantOwnedWorkOrder = {
  category?: string;
  closed_at?: string | null;
  description?: string;
  id: string;
  is_emergency?: boolean;
  status?: string;
  submitted_at?: string;
  tenant_email: string;
  unit_id?: string | null;
};

export type TenantOwnedWorkOrderResult = {
  tenantUser: TenantUser;
  workOrder: TenantOwnedWorkOrder;
};

function normalizeTenantEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getOptionalTenantUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  return {
    email: normalizeTenantEmail(user.email),
    id: user.id,
  } satisfies TenantUser;
}

export async function requireTenantUser() {
  const tenantUser = await getOptionalTenantUser();

  if (!tenantUser) {
    redirect("/tenant/sign-in");
  }

  return tenantUser;
}

export async function getTenantOwnedWorkOrder(workOrderId: string) {
  const tenantUser = await requireTenantUser();
  const supabase = createAdminSupabaseClient();

  const { data: workOrder, error } = await supabase
    .from("work_orders")
    .select(
      "id, tenant_email, unit_id, category, description, status, is_emergency, submitted_at, closed_at"
    )
    .eq("id", workOrderId)
    .single();

  if (error || !workOrder) {
    return null;
  }

  const tenantOwnedWorkOrder = workOrder as TenantOwnedWorkOrder;

  if (
    normalizeTenantEmail(tenantOwnedWorkOrder.tenant_email) !== tenantUser.email
  ) {
    return null;
  }

  return {
    tenantUser,
    workOrder: tenantOwnedWorkOrder,
  } satisfies TenantOwnedWorkOrderResult;
}

export async function requireTenantOwnedWorkOrder(workOrderId: string) {
  const ownedWorkOrder = await getTenantOwnedWorkOrder(workOrderId);

  if (!ownedWorkOrder) {
    redirect("/tenant");
  }

  return ownedWorkOrder;
}

export async function listTenantWorkOrders() {
  const tenantUser = await requireTenantUser();
  const supabase = createAdminSupabaseClient();

  const { data: workOrders, error } = await supabase
    .from("work_orders")
    .select(
      "id, tenant_email, category, status, is_emergency, submitted_at, closed_at"
    )
    .eq("tenant_email", tenantUser.email)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error("Tenant work orders could not be loaded.");
  }

  const workOrderRows = (workOrders ?? []) as TenantWorkOrderSummary[];
  const workOrderIds = workOrderRows.map((workOrder) => workOrder.id);

  let reportGeneratedAtMap = new Map<string, string | null>();

  if (workOrderIds.length > 0) {
    const { data: reports, error: reportsError } = await supabase
      .from("reports")
      .select("work_order_id, generated_at")
      .in("work_order_id", workOrderIds);

    if (reportsError) {
      throw new Error("Tenant report availability could not be loaded.");
    }

    reportGeneratedAtMap = new Map(
      (reports ?? []).map((report) => [report.work_order_id, report.generated_at])
    );
  }

  return {
    tenantUser,
    workOrders: workOrderRows.map((workOrder) => ({
      ...workOrder,
      report_generated_at: reportGeneratedAtMap.get(workOrder.id) ?? null,
    })),
  };
}
