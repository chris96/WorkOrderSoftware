import { redirect } from "next/navigation";

import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

export const staffRoles = ["super", "backup"] as const;

export type StaffRole = (typeof staffRoles)[number];

export type StaffUser = {
  email: string;
  fullName: string;
  id: string;
  role: StaffRole;
};

export async function getOptionalStaffUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const adminSupabase = createAdminSupabaseClient();
  const { data: staffUser } = await adminSupabase
    .from("users")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .eq("is_active", true)
    .in("role", [...staffRoles])
    .maybeSingle();

  if (!staffUser) {
    return null;
  }

  return {
    email: staffUser.email,
    fullName: staffUser.full_name,
    id: staffUser.id,
    role: staffUser.role as StaffRole,
  } satisfies StaffUser;
}

export async function requireStaffUser() {
  const staffUser = await getOptionalStaffUser();

  if (!staffUser) {
    redirect("/staff/sign-in");
  }

  return staffUser;
}
