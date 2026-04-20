import { redirect } from "next/navigation";

import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";

export type TenantUser = {
  email: string;
  id: string;
};

type TenantOwnedWorkOrder = {
  id: string;
  tenant_email: string;
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
    .select("id, tenant_email")
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
  };
}

export async function requireTenantOwnedWorkOrder(workOrderId: string) {
  const ownedWorkOrder = await getTenantOwnedWorkOrder(workOrderId);

  if (!ownedWorkOrder) {
    redirect("/tenant");
  }

  return ownedWorkOrder;
}
