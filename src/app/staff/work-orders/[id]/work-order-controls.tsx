"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import {
  activeWorkOrderStatuses,
  formatWorkOrderStatus,
  type WorkOrderStatus,
} from "@/lib/work-orders";

type StaffOption = {
  fullName: string;
  id: string;
  role: string;
};

type WorkOrderControlsProps = {
  assignedUserId: string | null;
  staffOptions: StaffOption[];
  status: WorkOrderStatus;
  workOrderId: string;
};

function getInputClassName() {
  return "w-full rounded-2xl border border-slate-200 bg-white/92 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500";
}

export function WorkOrderControls({
  assignedUserId,
  staffOptions,
  status,
  workOrderId,
}: WorkOrderControlsProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [selectedAssignee, setSelectedAssignee] = useState(assignedUserId ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const response = await fetch(`/api/staff/work-orders/${workOrderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assignedUserId: selectedAssignee || null,
        status: selectedStatus,
      }),
    });

    const payload = (await response.json()) as
      | {
          ok: true;
          message: string;
        }
      | {
          ok: false;
          message: string;
        };

    setMessage(payload.message);

    if (response.ok && payload.ok) {
      startTransition(() => {
        router.refresh();
      });
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {message ? (
        <div className="rounded-[1.25rem] border border-slate-200 bg-white/80 px-4 py-3 text-sm leading-7 text-slate-700">
          {message}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="status" className="app-label">
          Status
        </label>
        <select
          id="status"
          className={getInputClassName()}
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value as WorkOrderStatus)}
        >
          {(status === "closed"
            ? (["closed"] as WorkOrderStatus[])
            : [...activeWorkOrderStatuses]
          ).map((statusOption) => (
            <option
              key={statusOption}
              value={statusOption}
              className="bg-white text-slate-900"
            >
              {formatWorkOrderStatus(statusOption)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="assignee"
          className="app-label"
        >
          Assigned staff
        </label>
        <select
          id="assignee"
          className={getInputClassName()}
          value={selectedAssignee}
          onChange={(event) => setSelectedAssignee(event.target.value)}
        >
          <option value="" className="bg-white text-slate-900">
            Unassigned
          </option>
          {staffOptions.map((staffOption) => (
            <option
              key={staffOption.id}
              value={staffOption.id}
              className="bg-white text-slate-900"
            >
              {staffOption.fullName} ({staffOption.role})
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="app-button-primary w-full justify-center font-semibold disabled:bg-blue-300"
      >
        {isPending ? "Saving Changes..." : "Save Status and Assignment"}
      </button>
    </form>
  );
}
