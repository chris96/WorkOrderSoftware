import Link from "next/link";
import { notFound } from "next/navigation";

import { timeAsync } from "@/lib/performance";
import { requireStaffUser } from "@/lib/staff-auth";
import { attachSignedUrls } from "@/lib/supabase/storage";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  formatWorkOrderDateTime,
  formatWorkOrderStatus,
  getWorkOrderStatusClassName,
  type WorkOrderStatus,
} from "@/lib/work-orders";

import { CloseoutForm } from "./closeout-form";
import { InternalNoteForm } from "./internal-note-form";
import { ReportActions } from "./report-actions";
import { WorkOrderControls } from "./work-order-controls";

type RouteParams = Promise<{
  id: string;
}>;

type WorkOrderDetailRow = {
  assigned_user_id: string | null;
  category: string;
  closed_at: string | null;
  closed_by_user_id: string | null;
  closeout_internal_notes: string | null;
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

type WorkOrderPhotoRow = {
  content_type: string | null;
  created_at: string;
  id: string;
  photo_type: "intake" | "closeout";
  storage_bucket: string;
  storage_path: string;
};

type WorkOrderEventRow = {
  actor_user_id: string | null;
  created_at: string;
  event_type: "submitted" | "escalated" | "status_changed" | "note_added" | "closed";
  from_status: WorkOrderStatus | null;
  id: string;
  metadata: Record<string, unknown>;
  note: string | null;
  to_status: WorkOrderStatus | null;
};

type ReportRow = {
  delivered_at: string | null;
  delivery_status: "pending" | "sent" | "failed";
  email_message_id: string | null;
  generated_at: string | null;
  last_error: string | null;
  storage_bucket: string;
  storage_path: string;
};

const SIGNED_URL_TTL_SECONDS = 60 * 60;

function getTimelineTitle(event: WorkOrderEventRow) {
  if (event.event_type === "submitted") {
    return "Request submitted";
  }

  if (event.event_type === "status_changed") {
    return event.to_status
      ? `Status changed to ${formatWorkOrderStatus(event.to_status)}`
      : "Status updated";
  }

  if (event.event_type === "note_added") {
    const action = typeof event.metadata.action === "string" ? event.metadata.action : "";

    if (action === "assignment_changed") {
      return "Assignment updated";
    }

    return "Internal note";
  }

  if (event.event_type === "closed") {
    return "Work order closed";
  }

  return "Timeline event";
}

function getTimelineBody(event: WorkOrderEventRow) {
  const action = typeof event.metadata.action === "string" ? event.metadata.action : "";

  if (event.event_type === "submitted") {
    return "This request entered the system from the tenant intake flow.";
  }

  if (event.event_type === "status_changed") {
    const fromStatus = event.from_status
      ? formatWorkOrderStatus(event.from_status)
      : "Unknown";
    const toStatus = event.to_status
      ? formatWorkOrderStatus(event.to_status)
      : "Unknown";

    return `Moved from ${fromStatus} to ${toStatus}.`;
  }

  if (action === "assignment_changed" && event.note) {
    return event.note;
  }

  if (event.note) {
    return event.note;
  }

  return "No additional details were recorded for this timeline event.";
}

export default async function StaffWorkOrderDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  await timeAsync("staff.detail.auth", () => requireStaffUser());
  const { id } = await params;
  const supabase = createAdminSupabaseClient();

  const [workOrderResult, photosResult, eventsResult, staffUsersResult, reportResult] =
    await timeAsync("staff.detail.baseData", () => Promise.all([
      supabase
        .from("work_orders")
        .select(
          "id, unit_id, assigned_user_id, tenant_name, tenant_email, tenant_phone, category, description, status, is_emergency, submitted_at, closed_at, closed_by_user_id, repair_summary, materials_used, closeout_internal_notes"
        )
        .eq("id", id)
        .single(),
      supabase
        .from("work_order_photos")
        .select("id, storage_bucket, storage_path, content_type, created_at, photo_type")
        .eq("work_order_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("work_order_events")
        .select(
          "id, actor_user_id, event_type, from_status, to_status, note, metadata, created_at"
        )
        .eq("work_order_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("users")
        .select("id, full_name, role")
        .eq("is_active", true)
        .in("role", ["super", "backup"]),
      supabase
        .from("reports")
        .select(
          "storage_bucket, storage_path, delivery_status, generated_at, delivered_at, email_message_id, last_error"
        )
        .eq("work_order_id", id)
        .maybeSingle(),
    ]));

  if (workOrderResult.error || !workOrderResult.data) {
    notFound();
  }

  const workOrder = workOrderResult.data as WorkOrderDetailRow;
  const allPhotos = (photosResult.data ?? []) as WorkOrderPhotoRow[];

  const [unitResult, photoLinks] = await timeAsync("staff.detail.relatedData", () => Promise.all([
    workOrder.unit_id
      ? supabase
          .from("units")
          .select("unit_number")
          .eq("id", workOrder.unit_id)
          .single()
      : Promise.resolve({ data: null, error: null }),
    attachSignedUrls(
      supabase,
      allPhotos,
      SIGNED_URL_TTL_SECONDS,
      "Photo preview links could not be prepared."
    ),
  ]));

  const unitNumber = unitResult.data?.unit_number ?? "Unknown unit";

  const staffUserMap = new Map<string, { fullName: string; role: string }>();

  for (const user of staffUsersResult.data ?? []) {
    staffUserMap.set(user.id, {
      fullName: user.full_name,
      role: user.role,
    });
  }

  const assignedUser = workOrder.assigned_user_id
    ? staffUserMap.get(workOrder.assigned_user_id)
    : null;
  const closedByUser = workOrder.closed_by_user_id
    ? staffUserMap.get(workOrder.closed_by_user_id)
    : null;
  const intakePhotoLinks = photoLinks.filter((photo) => photo.photo_type === "intake");
  const closeoutPhotoLinks = photoLinks.filter(
    (photo) => photo.photo_type === "closeout"
  );

  const timelineEvents = (eventsResult.data ?? []) as WorkOrderEventRow[];
  const internalNotes = timelineEvents.filter((event) => {
    const action = typeof event.metadata.action === "string" ? event.metadata.action : "";
    return event.event_type === "note_added" && action !== "assignment_changed";
  });
  const report = reportResult.data as ReportRow | null;

  let reportStatusLabel = "Not generated yet";

  if (report?.delivery_status === "pending") {
    reportStatusLabel = "Generated and pending delivery";
  } else if (report?.delivery_status === "sent") {
    reportStatusLabel = "Tenant completion email sent";
  } else if (report?.delivery_status === "failed") {
    reportStatusLabel = "Delivery failed";
  }

  return (
    <main className="px-6 py-12 md:px-8 md:py-16">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <section className="app-panel">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl space-y-4">
              <p className="app-kicker">
                Staff Request Detail
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="app-chip">
                  Unit {unitNumber}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${getWorkOrderStatusClassName(workOrder.status)}`}
                >
                  {formatWorkOrderStatus(workOrder.status)}
                </span>
                {workOrder.is_emergency ? (
                  <span className="rounded-full border border-rose-200 bg-rose-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-rose-900">
                    Emergency
                  </span>
                ) : null}
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                {workOrder.category}
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-slate-600">
                {workOrder.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {workOrder.status === "closed" ? (
                <a
                  href={`/api/staff/work-orders/${workOrder.id}/report`}
                  target="_blank"
                  rel="noreferrer"
                  className="app-button-primary"
                >
                  Preview Repair Report
                </a>
              ) : null}
              <Link
                href="/staff"
                className="app-button-secondary"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="app-panel-subtle">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                Request ID
              </p>
              <p className="mt-3 text-lg font-semibold text-blue-700">
                {workOrder.id}
              </p>
            </div>

            <div className="app-panel-subtle">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                Submitted
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-900">
                {formatWorkOrderDateTime(workOrder.submitted_at)}
              </p>
            </div>

            <div className="app-panel-subtle">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                Assigned
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-900">
                {assignedUser?.fullName || "Unassigned"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {assignedUser?.role || "No staff owner yet"}
              </p>
            </div>

            <div className="app-panel-subtle">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                Closed
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-900">
                {formatWorkOrderDateTime(workOrder.closed_at)}
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-8">
            <section className="app-panel md:p-8">
              <div className="flex flex-col gap-6 md:grid md:grid-cols-2">
                <div className="app-panel-subtle">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                    Tenant contact
                  </p>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-slate-600">
                    <p className="font-medium text-slate-900">{workOrder.tenant_name}</p>
                    <p>{workOrder.tenant_email}</p>
                    <p>{workOrder.tenant_phone || "No phone provided"}</p>
                  </div>
                </div>

                <div className="app-panel-subtle">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                    Request summary
                  </p>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-slate-600">
                    <p>Category: {workOrder.category}</p>
                    <p>Status: {formatWorkOrderStatus(workOrder.status)}</p>
                    <p>
                      Priority: {workOrder.is_emergency ? "Emergency" : "Standard"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="app-panel md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                    Intake Photos
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                    Photo attachments
                  </h2>
                </div>
              </div>

              {intakePhotoLinks.length === 0 ? (
                <div className="app-panel-empty mt-6">
                  <p className="text-lg font-medium text-slate-900">
                    No intake photos were uploaded.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Future submissions with photos will appear here with private
                    signed links for staff review.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {intakePhotoLinks.map((photo, index) => (
                    <article
                      key={photo.id}
                      className="app-panel-subtle"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        Intake photo {index + 1}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        Uploaded {formatWorkOrderDateTime(photo.created_at)}
                      </p>
                      <p className="text-sm leading-7 text-slate-500">
                        {photo.content_type || "Unknown file type"}
                      </p>
                      {photo.signedUrl ? (
                        <a
                          href={photo.signedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="app-button-secondary mt-4 items-center justify-center px-4 py-2"
                        >
                          Open Photo
                        </a>
                      ) : (
                        <p className="mt-4 text-sm text-slate-500">
                          Signed preview link unavailable.
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="app-panel md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                    Closeout Photos
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                    Completion attachments
                  </h2>
                </div>
              </div>

              {closeoutPhotoLinks.length === 0 ? (
                <div className="app-panel-empty mt-6">
                  <p className="text-lg font-medium text-slate-900">
                    No closeout photos yet.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Once Phase 4 closeout is wired, after-repair photos will appear
                    here in a section separate from the original intake images.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {closeoutPhotoLinks.map((photo, index) => (
                    <article
                      key={photo.id}
                      className="app-panel-subtle"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        Closeout photo {index + 1}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        Uploaded {formatWorkOrderDateTime(photo.created_at)}
                      </p>
                      <p className="text-sm leading-7 text-slate-500">
                        {photo.content_type || "Unknown file type"}
                      </p>
                      {photo.signedUrl ? (
                        <a
                          href={photo.signedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="app-button-secondary mt-4 items-center justify-center px-4 py-2"
                        >
                          Open Photo
                        </a>
                      ) : (
                        <p className="mt-4 text-sm text-slate-500">
                          Signed preview link unavailable.
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="app-panel md:p-8">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                Timeline
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                Request history
              </h2>

              {timelineEvents.length === 0 ? (
                <div className="app-panel-empty mt-6">
                  <p className="text-lg font-medium text-slate-900">
                    No timeline entries yet.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Staff notes, status changes, and assignment updates will
                    appear here as the request moves forward.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {timelineEvents.map((event) => {
                    const actor = event.actor_user_id
                      ? staffUserMap.get(event.actor_user_id)
                      : null;

                    return (
                      <article
                        key={event.id}
                        className="app-panel-subtle"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-lg font-medium text-slate-900">
                              {getTimelineTitle(event)}
                            </p>
                            <p className="mt-2 text-sm leading-7 text-slate-600">
                              {getTimelineBody(event)}
                            </p>
                          </div>
                          <div className="app-panel-subtle md:min-w-[220px]">
                            <p>{formatWorkOrderDateTime(event.created_at)}</p>
                            <p>{actor?.fullName || "System or tenant flow"}</p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </section>

          <aside className="space-y-8">
            <section className="app-panel md:p-8">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                Closeout Workflow
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                Repair completion
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                This Phase 4 panel is where staff will finish the repair, capture
                the required summary, and attach after-work photos before the
                request moves into a completed state.
              </p>

              <div className="mt-6">
                <CloseoutForm
                  closedAt={formatWorkOrderDateTime(workOrder.closed_at)}
                  closedByName={closedByUser?.fullName ?? null}
                  completionNotes={workOrder.closeout_internal_notes}
                  isClosed={workOrder.status === "closed"}
                  materialsUsed={workOrder.materials_used}
                  repairSummary={workOrder.repair_summary}
                  workOrderId={workOrder.id}
                />
              </div>
            </section>

            <section className="app-panel md:p-8">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                Repair Report
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                Report delivery
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                This panel tracks the tenant-facing repair report and completion email.
              </p>

              <div className="mt-6 app-panel-subtle">
                <div className="space-y-3 text-sm leading-7 text-slate-600">
                  <p>
                    <span className="font-medium text-slate-900">Status:</span>{" "}
                    {reportStatusLabel}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Generated:</span>{" "}
                    {formatWorkOrderDateTime(report?.generated_at ?? null)}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Delivered:</span>{" "}
                    {formatWorkOrderDateTime(report?.delivered_at ?? null)}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Email ID:</span>{" "}
                    {report?.email_message_id || "Not recorded"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Storage path:</span>{" "}
                    {report?.storage_path || "Not stored yet"}
                  </p>
                  {report?.last_error ? (
                    <p className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
                      {report.last_error}
                    </p>
                  ) : null}
                </div>
              </div>

              <ReportActions
                isClosed={workOrder.status === "closed"}
                workOrderId={workOrder.id}
              />
            </section>

            <section className="app-panel md:p-8">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                Manage Request
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                Status and assignment
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Use this panel to move the request through the workflow and assign
                ownership to the super or backup user.
              </p>

              <div className="mt-6">
                <WorkOrderControls
                  workOrderId={workOrder.id}
                  status={workOrder.status}
                  assignedUserId={workOrder.assigned_user_id}
                  staffOptions={(staffUsersResult.data ?? []).map((user) => ({
                    fullName: user.full_name,
                    id: user.id,
                    role: user.role,
                  }))}
                />
              </div>
            </section>

            <section className="app-panel md:p-8">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                Internal Notes
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                Staff-only context
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                These notes are only visible inside the staff workflow and are
                never shown in tenant-facing views.
              </p>

              <div className="mt-6">
                <InternalNoteForm workOrderId={workOrder.id} />
              </div>

              {internalNotes.length === 0 ? (
                <div className="app-panel-empty mt-6 px-5 py-6 text-sm leading-7 text-slate-500">
                  No internal notes yet.
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {internalNotes.map((event) => {
                    const actor = event.actor_user_id
                      ? staffUserMap.get(event.actor_user_id)
                      : null;

                    return (
                      <article
                        key={event.id}
                        className="app-panel-muted p-4"
                      >
                        <div className="flex flex-col gap-2 text-sm leading-7 text-slate-600">
                          <p className="font-medium text-slate-900">
                            {actor?.fullName || "Staff"} on{" "}
                            {formatWorkOrderDateTime(event.created_at)}
                          </p>
                          <p>{event.note}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

